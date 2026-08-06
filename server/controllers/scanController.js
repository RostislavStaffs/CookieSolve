import mongoose from "mongoose";

import Scan from "../models/Scan.js";

import {
  runRuntimeScan,
} from "../services/runtimeScanner.js";

import {
  analyseRuntimeFindings,
  buildFindingsSummary,
} from "../services/findingsAnalyzer.js";

import {
  scanSourceCode,
} from "../services/sourceCodeScanner.js";

import {
  correlateFindings,
} from "../services/findingsCorrelator.js";

function getAuthenticatedUserId(
  request,
) {
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
      .map((item) =>
        item.trim(),
      )
      .filter(Boolean);
  }

  return [];
}

function parseBoolean(
  value,
  defaultValue,
) {
  if (
    typeof value === "boolean"
  ) {
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

function validateTargetUrl(
  targetUrl,
) {
  try {
    const parsedUrl =
      new URL(targetUrl);

    return [
      "http:",
      "https:",
    ].includes(
      parsedUrl.protocol,
    );
  } catch {
    return false;
  }
}

function createEmptyRuntimePhase() {
  return {
    cookies: [],
    networkRequests: [],
    browserStorage: [],
  };
}

function deriveScanMode(
  scanOptions,
) {
  const hasRuntimeChecks =
    scanOptions.cookies ||
    scanOptions.networkRequests ||
    scanOptions.browserStorage;

  const hasSourceCodeCheck =
    scanOptions.sourceCode;

  if (
    hasRuntimeChecks &&
    hasSourceCodeCheck
  ) {
    return "hybrid";
  }

  if (hasRuntimeChecks) {
    return "runtime";
  }

  return "source-code";
}

function createLegacySummary({
  preConsent,
  postAction,
  findingsSummary,
  consentAction,
  scanMode,
}) {
  const hasRuntimeEvidence =
    scanMode === "runtime" ||
    scanMode === "hybrid";

  return {
    cookiesBeforeConsent:
      hasRuntimeEvidence
        ? preConsent.cookies.length
        : 0,

    cookiesAfterRejection:
      hasRuntimeEvidence &&
      consentAction === "reject"
        ? postAction.cookies.length
        : 0,

    thirdPartyRequestsBeforeConsent:
      hasRuntimeEvidence
        ? preConsent.networkRequests.filter(
            (request) =>
              request.isThirdParty,
          ).length
        : 0,

    thirdPartyRequestsAfterRejection:
      hasRuntimeEvidence &&
      consentAction === "reject"
        ? postAction.networkRequests.filter(
            (request) =>
              request.isThirdParty,
          ).length
        : 0,

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
      "Starting scan";
    scan.startedAt = new Date();
    scan.completedAt = null;
    scan.errorMessage = "";

    await scan.save();

    const hasRuntimeChecks =
      scan.scanMode === "runtime" ||
      scan.scanMode === "hybrid";

    const hasSourceCodeCheck =
      scan.scanMode === "source-code" ||
      scan.scanMode === "hybrid";

    let runtimeResult = {
      preConsent:
        createEmptyRuntimePhase(),

      postAction:
        createEmptyRuntimePhase(),
    };

    let runtimeFindings = [];
    let sourceCodeFindings = [];

    /*
     * Runtime analysis is completely skipped
     * for source-code-only scans.
     */
    if (hasRuntimeChecks) {
      runtimeResult =
        await runRuntimeScan({
          targetUrl:
            scan.targetUrl,

          consentAction:
            scan.consentAction,

          acceptSelector:
            scan.acceptSelector,

          rejectSelector:
            scan.rejectSelector,

          browser:
            scan.browser,

          waitTime:
            scan.waitTime,

          scanOptions:
            scan.scanOptions,

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
        "Analysing runtime evidence",
      );

      const runtimeAnalysis =
        analyseRuntimeFindings({
          preConsent:
            runtimeResult.preConsent,

          postAction:
            runtimeResult.postAction,

          consentAction:
            scan.consentAction,

          necessaryCookieAllowlist:
            scan.necessaryCookieAllowlist,

          scanOptions:
            scan.scanOptions,
        });

      runtimeFindings =
        runtimeAnalysis.findings;
    }

    if (hasSourceCodeCheck) {
      const sourceCodeResult =
        await scanSourceCode({
          sourceCodeFolder:
            scan.sourceCodeFolder,

          onStepChange: async (
            currentStep,
          ) => {
            await updateScanStep(
              scan._id,
              currentStep,
            );
          },
        });

      sourceCodeFindings =
        sourceCodeResult.findings;
    }

    await updateScanStep(
      scan._id,
      "Combining scan findings",
    );

    const combinedFindings = [
      ...runtimeFindings,
      ...sourceCodeFindings,
    ];

    /*
     * Correlation is meaningful only when both
     * runtime and static evidence exist.
     */
    let correlations = [];

    if (scan.scanMode === "hybrid") {
      await updateScanStep(
        scan._id,
        "Correlating runtime and source evidence",
      );

      correlations =
        correlateFindings(
          combinedFindings,
        );
    }

    const combinedSummary =
      buildFindingsSummary(
        combinedFindings,
      );

    combinedSummary.correlations =
      correlations.length;

    combinedSummary
      .highConfidenceCorrelations =
      correlations.filter(
        (correlation) =>
          correlation.confidence ===
          "high",
      ).length;

    scan.preConsent =
      runtimeResult.preConsent;

    scan.postAction =
      runtimeResult.postAction;

    scan.postRejection =
      hasRuntimeChecks &&
      scan.consentAction === "reject"
        ? runtimeResult.postAction
        : createEmptyRuntimePhase();

    scan.findings =
      combinedFindings;

    scan.correlations =
      correlations;

    scan.findingsSummary =
      combinedSummary;

    scan.summary =
      createLegacySummary({
        preConsent:
          runtimeResult.preConsent,

        postAction:
          runtimeResult.postAction,

        findingsSummary:
          combinedSummary,

        consentAction:
          scan.consentAction,

        scanMode:
          scan.scanMode,
      });

    scan.status = "completed";
    scan.currentStep =
      "Scan completed";
    scan.completedAt = new Date();
    scan.errorMessage = "";

    await scan.save();
  } catch (error) {
    console.error(
      "Scan failed:",
      error,
    );

    try {
      await Scan.findByIdAndUpdate(
        scanId,
        {
          status: "failed",
          currentStep:
            "Scan failed",

          errorMessage:
            error instanceof Error
              ? error.message
              : "The scan failed.",

          completedAt:
            new Date(),
        },
      );
    } catch (updateError) {
      console.error(
        "Unable to save scan failure:",
        updateError,
      );
    }
  }
}

export async function createScan(
  request,
  response,
) {
  try {
    const userId =
      getAuthenticatedUserId(
        request,
      );

    if (!userId) {
      return response
        .status(401)
        .json({
          message:
            "Authentication is required.",
        });
    }

    const {
      targetUrl = "",
      consentAction = "reject",
      acceptSelector = "#accept-all",
      rejectSelector = "#reject-all",
      browser = "chromium",
      waitTime = 1500,
      sourceCodeFolder = "",
      scanOptions = {},
    } = request.body;

    const resolvedScanOptions = {
      cookies:
        parseBoolean(
          scanOptions.cookies,
          true,
        ),

      networkRequests:
        parseBoolean(
          scanOptions.networkRequests,
          true,
        ),

      browserStorage:
        parseBoolean(
          scanOptions.browserStorage,
          true,
        ),

      sourceCode:
        parseBoolean(
          scanOptions.sourceCode,
          false,
        ),
    };

    if (
      !resolvedScanOptions.cookies &&
      !resolvedScanOptions.networkRequests &&
      !resolvedScanOptions.browserStorage &&
      !resolvedScanOptions.sourceCode
    ) {
      return response
        .status(400)
        .json({
          message:
            "Select at least one scan option.",
        });
    }

    const scanMode =
      deriveScanMode(
        resolvedScanOptions,
      );

    const hasRuntimeChecks =
      scanMode === "runtime" ||
      scanMode === "hybrid";

    const hasSourceCodeCheck =
      scanMode === "source-code" ||
      scanMode === "hybrid";

    /*
     * Runtime validation applies only when
     * Playwright will actually be used.
     */
    if (hasRuntimeChecks) {
      if (
        !targetUrl ||
        !validateTargetUrl(
          targetUrl,
        )
      ) {
        return response
          .status(400)
          .json({
            message:
              "Enter a valid HTTP or HTTPS target URL for runtime scanning.",
          });
      }

      if (
        ![
          "accept",
          "reject",
        ].includes(
          consentAction,
        )
      ) {
        return response
          .status(400)
          .json({
            message:
              "Select either Accept All or Reject All.",
          });
      }

      const selectedSelector =
        consentAction === "accept"
          ? acceptSelector
          : rejectSelector;

      if (
        typeof selectedSelector !==
          "string" ||
        !selectedSelector.trim()
      ) {
        return response
          .status(400)
          .json({
            message:
              consentAction === "accept"
                ? "An Accept All button selector is required."
                : "A Reject All button selector is required.",
          });
      }
    }

    if (
      hasSourceCodeCheck &&
      !String(
        sourceCodeFolder,
      ).trim()
    ) {
      return response
        .status(400)
        .json({
          message:
            "Enter a source-code folder when source-code scanning is enabled.",
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
      return response
        .status(400)
        .json({
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
      !supportedBrowsers.includes(
        browser,
      )
    ) {
      return response
        .status(400)
        .json({
          message:
            "The selected browser is not supported.",
        });
    }

    const necessaryCookieAllowlist =
      parseAllowlist(
        request.body
          .necessaryCookieAllowlist,
      );

    const scan =
      await Scan.create({
        user: userId,

        scanMode,

        targetUrl:
          hasRuntimeChecks
            ? String(
                targetUrl,
              ).trim()
            : "",

        consentAction,

        acceptSelector:
          String(
            acceptSelector,
          ).trim(),

        rejectSelector:
          String(
            rejectSelector,
          ).trim(),

        browser,

        waitTime:
          numericWaitTime,

        necessaryCookieAllowlist,

        sourceCodeFolder:
          hasSourceCodeCheck
            ? String(
                sourceCodeFolder,
              ).trim()
            : "",

        scanOptions:
          resolvedScanOptions,

        status: "pending",

        currentStep:
          "Waiting to start",
      });

    void executeScan(
      scan._id,
    );

    return response
      .status(202)
      .json({
        message:
          "Scan started.",

        scan,
      });
  } catch (error) {
    console.error(
      "Unable to create scan:",
      error,
    );

    return response
      .status(500)
      .json({
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
      getAuthenticatedUserId(
        request,
      );

    if (!userId) {
      return response
        .status(401)
        .json({
          message:
            "Authentication is required.",
        });
    }

    const { scanId } =
      request.params;

    if (
      !mongoose.isValidObjectId(
        scanId,
      )
    ) {
      return response
        .status(400)
        .json({
          message:
            "The scan ID is invalid.",
        });
    }

    const scan =
      await Scan.findOne({
        _id: scanId,
        user: userId,
      }).lean();

    if (!scan) {
      return response
        .status(404)
        .json({
          message:
            "Scan not found.",
        });
    }

    return response
      .status(200)
      .json({
        scan,
      });
  } catch (error) {
    console.error(
      "Unable to retrieve scan:",
      error,
    );

    return response
      .status(500)
      .json({
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
      getAuthenticatedUserId(
        request,
      );

    if (!userId) {
      return response
        .status(401)
        .json({
          message:
            "Authentication is required.",
        });
    }

    const scans =
      await Scan.find({
        user: userId,
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    return response
      .status(200)
      .json({
        scans,
      });
  } catch (error) {
    console.error(
      "Unable to retrieve scans:",
      error,
    );

    return response
      .status(500)
      .json({
        message:
          "The scans could not be retrieved.",
      });
  }
}

export async function deleteScan(
  request,
  response,
) {
  try {
    const userId =
      getAuthenticatedUserId(
        request,
      );

    if (!userId) {
      return response
        .status(401)
        .json({
          message:
            "Authentication is required.",
        });
    }

    const { scanId } =
      request.params;

    if (
      !mongoose.isValidObjectId(
        scanId,
      )
    ) {
      return response
        .status(400)
        .json({
          message:
            "The scan ID is invalid.",
        });
    }

    const scan =
      await Scan.findOne({
        _id: scanId,
        user: userId,
      });

    if (!scan) {
      return response
        .status(404)
        .json({
          message:
            "Scan not found.",
        });
    }

    if (
      scan.status === "pending" ||
      scan.status === "running"
    ) {
      return response
        .status(409)
        .json({
          message:
            "A scan cannot be deleted while it is still running.",
        });
    }

    await Scan.deleteOne({
      _id: scan._id,
      user: userId,
    });

    return response
      .status(200)
      .json({
        message:
          "Scan deleted successfully.",

        scanId:
          String(scan._id),
      });
  } catch (error) {
    console.error(
      "Unable to delete scan:",
      error,
    );

    return response
      .status(500)
      .json({
        message:
          "The scan could not be deleted.",
      });
  }
}