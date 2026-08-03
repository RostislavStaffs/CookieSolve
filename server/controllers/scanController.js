import Scan from "../models/Scan.js";
import { runRuntimeScan } from "../../src/services/runtimeScanner.js";

function normaliseTargetUrl(value) {
  const trimmedValue = value.trim();

  if (
    trimmedValue.startsWith("http://") ||
    trimmedValue.startsWith("https://")
  ) {
    return trimmedValue;
  }

  return `http://${trimmedValue}`;
}

function validateTargetUrl(value) {
  try {
    const parsedUrl = new URL(value);

    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

function buildSummary(preConsent, postRejection) {
  const preConsentThirdPartyRequests =
    preConsent.networkRequests.filter(
      (request) => request.isThirdParty,
    );

  const postRejectionThirdPartyRequests =
    postRejection.networkRequests.filter(
      (request) => request.isThirdParty,
    );

  /*
   * This is an initial technical warning count, not a legal
   * compliance determination. Classification will be improved later.
   */
  const issuesDetected =
    preConsent.cookies.length +
    postRejection.cookies.length +
    preConsentThirdPartyRequests.length +
    postRejectionThirdPartyRequests.length;

  return {
    cookiesBeforeConsent: preConsent.cookies.length,
    cookiesAfterRejection: postRejection.cookies.length,
    thirdPartyRequestsBeforeConsent:
      preConsentThirdPartyRequests.length,
    thirdPartyRequestsAfterRejection:
      postRejectionThirdPartyRequests.length,
    issuesDetected,
  };
}

export async function createScan(request, response) {
  const {
    targetUrl,
    rejectSelector,
    browser = "chromium",
    waitTime = 3000,
  } = request.body;

  if (!targetUrl?.trim()) {
    return response.status(400).json({
      message: "Enter a target website URL.",
    });
  }

  if (!rejectSelector?.trim()) {
    return response.status(400).json({
      message: "Enter the CSS selector for the reject button.",
    });
  }

  const normalisedUrl = normaliseTargetUrl(targetUrl);

  if (!validateTargetUrl(normalisedUrl)) {
    return response.status(400).json({
      message: "Enter a valid HTTP or HTTPS URL.",
    });
  }

  const parsedWaitTime = Number(waitTime);

  if (
    !Number.isFinite(parsedWaitTime) ||
    parsedWaitTime < 0 ||
    parsedWaitTime > 30000
  ) {
    return response.status(400).json({
      message: "Wait time must be between 0 and 30000 milliseconds.",
    });
  }

  const scan = await Scan.create({
    user: request.user._id,
    targetUrl: normalisedUrl,
    rejectSelector: rejectSelector.trim(),
    browser,
    waitTime: parsedWaitTime,
    status: "running",
    currentStep: "Preparing scan",
    startedAt: new Date(),
  });

  /*
   * Return immediately so the frontend is not forced to keep one
   * long HTTP request open throughout the browser scan.
   */
  response.status(202).json({
    message: "Scan started.",
    scan: {
      id: scan._id,
      status: scan.status,
      currentStep: scan.currentStep,
    },
  });

  try {
    const results = await runRuntimeScan({
      targetUrl: scan.targetUrl,
      rejectSelector: scan.rejectSelector,
      browserName: scan.browser,
      waitTime: scan.waitTime,

      onProgress: async (currentStep) => {
        await Scan.findByIdAndUpdate(scan._id, {
          currentStep,
        });
      },
    });

    const summary = buildSummary(
      results.preConsent,
      results.postRejection,
    );

    await Scan.findByIdAndUpdate(scan._id, {
      status: "completed",
      currentStep: "Scan completed",
      preConsent: results.preConsent,
      postRejection: results.postRejection,
      summary,
      completedAt: new Date(),
      errorMessage: "",
    });
  } catch (error) {
    console.error(`Scan ${scan._id} failed:`, error);

    await Scan.findByIdAndUpdate(scan._id, {
      status: "failed",
      currentStep: "Scan failed",
      errorMessage:
        error.message || "An unexpected scan error occurred.",
      completedAt: new Date(),
    });
  }
}

export async function getScan(request, response) {
  const scan = await Scan.findOne({
    _id: request.params.scanId,
    user: request.user._id,
  });

  if (!scan) {
    return response.status(404).json({
      message: "Scan not found.",
    });
  }

  return response.status(200).json({
    scan,
  });
}

export async function getScans(request, response) {
  const scans = await Scan.find({
    user: request.user._id,
  })
    .sort({ createdAt: -1 })
    .select(
      "targetUrl browser status currentStep summary createdAt completedAt errorMessage",
    );

  return response.status(200).json({
    scans,
  });
}