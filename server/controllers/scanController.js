import Scan from "../models/Scan.js";

import {
  runRuntimeScan,
} from "../services/runtimeScanner.js";

import {
  analyseRuntimeFindings,
} from "../services/findingsAnalyzer.js";

function getAuthenticatedUserId(request) {
  return (
    request.user?._id ??
    request.user?.id ??
    request.user?.userId ??
    null
  );
}

function parseAllowlist(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item).trim(),
      )
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function parseBoolean(
  value,
  defaultValue,
) {
  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return defaultValue;
}

function validateTargetUrl(targetUrl) {
  try {
    const parsedUrl =
      new URL(targetUrl);

    return ["http:", "https:"].includes(
      parsedUrl.protocol,
    );
  } catch {
    return false;
  }
}

function createLegacySummary({
  preConsent,
  postRejection,
  findingsSummary,
}) {
  return {
    cookiesBeforeConsent:
      preConsent.cookies.length,

    cookiesAfterRejection:
      postRejection.cookies.length,

    thirdPartyRequestsBeforeConsent:
      preConsent.networkRequests.filter(
        (request) =>
          request.isThirdParty,
      ).length,

    thirdPartyRequestsAfterRejection:
      postRejection.networkRequests.filter(
        (request) =>
          request.isThirdParty,
      ).length,

    issuesDetected:
      findingsSummary.total,
  };
}

async function updateScanStep(
  scanId,
  currentStep,
) {
  await Scan.findByIdAndUpdate(
    scanId,
    {
      currentStep,
    },
  );
}

async function executeScan(scanId) {
  try {
    const scan =
      await Scan.findById(scanId);

    if (!scan) {
      return;
    }

    scan.status = "running";
    scan.currentStep =
      "Starting runtime scan";
    scan.startedAt = new Date();
    scan.errorMessage = "";

    await scan.save();

    const runtimeResult =
      await runRuntimeScan({
        targetUrl: scan.targetUrl,
        rejectSelector:
          scan.rejectSelector,
        browser: scan.browser,
        waitTime: scan.waitTime,

        onStepChange: async (
          currentStep,
        ) => {
          await updateScanStep(
            scan._id,
            currentStep,
          );
        },
      });

    await updateScanStep(
      scan._id,
      "Analysing captured evidence",
    );

    const analysis =
      analyseRuntimeFindings({
        preConsent:
          runtimeResult.preConsent,

        postRejection:
          runtimeResult.postRejection,

        necessaryCookieAllowlist:
          scan.necessaryCookieAllowlist,
      });

    scan.preConsent =
      runtimeResult.preConsent;

    scan.postRejection =
      runtimeResult.postRejection;

    scan.findings =
      analysis.findings;

    scan.findingsSummary =
      analysis.summary;

    /*
     * Temporary compatibility summary.
     * We will remove this after updating
     * the frontend results page.
     */
    scan.summary =
      createLegacySummary({
        preConsent:
          runtimeResult.preConsent,

        postRejection:
          runtimeResult.postRejection,

        findingsSummary:
          analysis.summary,
      });

    scan.status = "completed";
    scan.currentStep =
      "Scan completed";
    scan.completedAt = new Date();
    scan.errorMessage = "";

    await scan.save();
  } catch (error) {
    console.error(
      "Runtime scan failed:",
      error,
    );

    await Scan.findByIdAndUpdate(
      scanId,
      {
        status: "failed",
        currentStep: "Scan failed",
        errorMessage:
          error instanceof Error
            ? error.message
            : "The runtime scan failed.",
        completedAt: new Date(),
      },
    );
  }
}

export async function createScan(
  request,
  response,
) {
  try {
    const userId =
      getAuthenticatedUserId(request);

    if (!userId) {
      return response.status(401).json({
        message:
          "Authentication is required.",
      });
    }

    const {
      targetUrl,
      rejectSelector,
      browser = "chromium",
      waitTime = 1500,
      sourceCodeFolder = "",
      scanOptions = {},
    } = request.body;

    if (
      !targetUrl ||
      !validateTargetUrl(targetUrl)
    ) {
      return response.status(400).json({
        message:
          "Enter a valid HTTP or HTTPS target URL.",
      });
    }

    if (
      !rejectSelector ||
      typeof rejectSelector !== "string"
    ) {
      return response.status(400).json({
        message:
          "A reject-button CSS selector is required.",
      });
    }

    const numericWaitTime =
      Number(waitTime);

    if (
      !Number.isFinite(
        numericWaitTime,
      ) ||
      numericWaitTime < 0 ||
      numericWaitTime > 30000
    ) {
      return response.status(400).json({
        message:
          "Wait time must be between 0 and 30000 milliseconds.",
      });
    }

    const supportedBrowsers = [
      "chromium",
      "firefox",
      "webkit",
    ];

    if (
      !supportedBrowsers.includes(browser)
    ) {
      return response.status(400).json({
        message:
          "The selected browser is not supported.",
      });
    }

    const necessaryCookieAllowlist =
      parseAllowlist(
        request.body
          .necessaryCookieAllowlist,
      );

    const scan = await Scan.create({
      user: userId,
      targetUrl: targetUrl.trim(),
      rejectSelector:
        rejectSelector.trim(),
      browser,
      waitTime: numericWaitTime,
      necessaryCookieAllowlist,
      sourceCodeFolder:
        String(sourceCodeFolder).trim(),

      scanOptions: {
        cookies: parseBoolean(
          scanOptions.cookies,
          true,
        ),

        networkRequests: parseBoolean(
          scanOptions.networkRequests,
          true,
        ),

        browserStorage: parseBoolean(
          scanOptions.browserStorage,
          true,
        ),

        sourceCode: parseBoolean(
          scanOptions.sourceCode,
          false,
        ),
      },

      status: "pending",
      currentStep:
        "Waiting to start",
    });

    /*
     * Start asynchronously so the frontend
     * receives the scan ID immediately and
     * can poll for progress.
     */
    void executeScan(scan._id);

    return response.status(202).json({
      message: "Scan started.",
      scan,
    });
  } catch (error) {
    console.error(
      "Unable to create scan:",
      error,
    );

    return response.status(500).json({
      message:
        "The scan could not be started.",
    });
  }
}

export async function getScan(
  request,
  response,
) {
  try {
    const userId =
      getAuthenticatedUserId(request);

    const { scanId } = request.params;

    const scan = await Scan.findOne({
      _id: scanId,
      user: userId,
    }).lean();

    if (!scan) {
      return response.status(404).json({
        message: "Scan not found.",
      });
    }

    return response.status(200).json({
      scan,
    });
  } catch (error) {
    console.error(
      "Unable to retrieve scan:",
      error,
    );

    return response.status(500).json({
      message:
        "The scan could not be retrieved.",
    });
  }
}

export async function getScans(
  request,
  response,
) {
  try {
    const userId =
      getAuthenticatedUserId(request);

    const scans = await Scan.find({
      user: userId,
    })
      .sort({
        createdAt: -1,
      })
      .lean();

    return response.status(200).json({
      scans,
    });
  } catch (error) {
    console.error(
      "Unable to retrieve scans:",
      error,
    );

    return response.status(500).json({
      message:
        "The scans could not be retrieved.",
    });
  }
}