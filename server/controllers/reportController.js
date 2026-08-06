import mongoose from "mongoose";

import Scan from "../models/Scan.js";
import Report from "../models/Report.js";

import {
  generateScanReport,
} from "../services/reportGenerator.js";

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

function sanitiseFilename(
  filename,
) {
  return String(filename)
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "-",
    )
    .slice(0, 180);
}

function sanitiseReportName(
  value,
) {
  const cleanedValue =
    String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(
        /^https?:\/\//,
        "",
      )
      .replace(
        /[^a-z0-9]+/g,
        "-",
      )
      .replace(
        /^-+|-+$/g,
        "")
      .slice(0, 60);

  return (
    cleanedValue ||
    "cookiesolve-scan"
  );
}

function getReportTarget(scan) {
  if (
    scan.scanMode ===
    "source-code"
  ) {
    return (
      scan.sourceCodeFolder ||
      "Unknown source folder"
    );
  }

  return (
    scan.targetUrl ||
    "Unknown target"
  );
}

function getReportStatus(scan) {
  if (scan.status === "failed") {
    return "failed";
  }

  const summary =
    scan.findingsSummary ?? {};

  const hasFindings =
    Number(summary.high ?? 0) > 0 ||
    Number(summary.medium ?? 0) > 0 ||
    Number(summary.low ?? 0) > 0 ||
    Number(summary.total ?? 0) > 0;

  return hasFindings
    ? "warning"
    : "passed";
}

function createReportRecordName({
  scan,
  format,
}) {
  const target =
    sanitiseReportName(
      getReportTarget(scan),
    );

  const shortScanId =
    String(
      scan._id ?? "",
    ).slice(-6);

  return [
    target,
    shortScanId,
    format,
    "report",
  ]
    .filter(Boolean)
    .join("-");
}

function canGenerateReport(scan) {
  if (
    scan.status === "pending" ||
    scan.status === "running"
  ) {
    return {
      allowed: false,

      message:
        "The report cannot be generated while the scan is still running.",
    };
  }

  if (
    scan.status === "failed" &&
    (
      !Array.isArray(
        scan.findings,
      ) ||
      scan.findings.length === 0
    )
  ) {
    return {
      allowed: false,

      message:
        "This failed scan does not contain enough evidence to generate a report.",
    };
  }

  return {
    allowed: true,
    message: "",
  };
}

async function findOwnedScan({
  scanId,
  userId,
}) {
  return Scan.findOne({
    _id: scanId,
    user: userId,
  }).lean();
}

async function saveReportRecord({
  scan,
  userId,
  format,
}) {
  const findingsSummary =
    scan.findingsSummary ?? {};

  return Report.create({
    user: userId,
    scan: scan._id,

    name:
      createReportRecordName({
        scan,
        format,
      }),

    format,

    target:
      getReportTarget(scan),

    scanMode:
      scan.scanMode ??
      "runtime",

    status:
      getReportStatus(scan),

    findingCount:
      Number(
        findingsSummary.total ??
        scan.findings?.length ??
        0,
      ),

    highSeverityCount:
      Number(
        findingsSummary.high ??
        0,
      ),

    mediumSeverityCount:
      Number(
        findingsSummary.medium ??
        0,
      ),

    lowSeverityCount:
      Number(
        findingsSummary.low ??
        0,
      ),

    exportedAt:
      new Date(),
  });
}

function sendGeneratedReport({
  response,
  generatedReport,
}) {
  const filename =
    sanitiseFilename(
      generatedReport.filename,
    );

  response.setHeader(
    "Content-Type",
    generatedReport.contentType,
  );

  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`,
  );

  response.setHeader(
    "Cache-Control",
    "private, no-store",
  );

  return response
    .status(200)
    .send(
      generatedReport.content,
    );
}

/*
 * Used from the Scan Results page.
 *
 * Every successful export creates a new report
 * metadata record in MongoDB.
 */
export async function downloadScanReport(
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

    const format =
      String(
        request.query.format ??
        "html",
      )
        .trim()
        .toLowerCase();

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

    if (
      ![
        "html",
        "json",
      ].includes(format)
    ) {
      return response
        .status(400)
        .json({
          message:
            "Report format must be html or json.",
        });
    }

    const scan =
      await findOwnedScan({
        scanId,
        userId,
      });

    if (!scan) {
      return response
        .status(404)
        .json({
          message:
            "Scan not found.",
        });
    }

    const reportPermission =
      canGenerateReport(scan);

    if (
      !reportPermission.allowed
    ) {
      return response
        .status(409)
        .json({
          message:
            reportPermission.message,
        });
    }

    const generatedReport =
      generateScanReport({
        scan,
        format,
      });

    /*
     * Save the export record before sending the
     * generated file to the browser.
     */
    await saveReportRecord({
      scan,
      userId,
      format,
    });

    return sendGeneratedReport({
      response,
      generatedReport,
    });
  } catch (error) {
    console.error(
      "Unable to generate scan report:",
      error,
    );

    return response
      .status(500)
      .json({
        message:
          error instanceof Error
            ? error.message
            : "The report could not be generated.",
      });
  }
}

/*
 * Returns all exported report metadata belonging
 * to the currently authenticated user.
 */
export async function getExportedReports(
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

    const reports =
      await Report.find({
        user: userId,
      })
        .sort({
          exportedAt: -1,
          createdAt: -1,
        })
        .lean();

    return response
      .status(200)
      .json({
        reports,
      });
  } catch (error) {
    console.error(
      "Unable to retrieve exported reports:",
      error,
    );

    return response
      .status(500)
      .json({
        message:
          "The exported reports could not be retrieved.",
      });
  }
}

/*
 * Regenerates an existing exported report using
 * its saved format and associated scan.
 *
 * This does not create another report record.
 */
export async function openExportedReport(
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

    const { reportId } =
      request.params;

    if (
      !mongoose.isValidObjectId(
        reportId,
      )
    ) {
      return response
        .status(400)
        .json({
          message:
            "The report ID is invalid.",
        });
    }

    const report =
      await Report.findOne({
        _id: reportId,
        user: userId,
      }).lean();

    if (!report) {
      return response
        .status(404)
        .json({
          message:
            "Report not found.",
        });
    }

    const scan =
      await findOwnedScan({
        scanId:
          report.scan,

        userId,
      });

    if (!scan) {
      return response
        .status(404)
        .json({
          message:
            "The scan associated with this report no longer exists.",
        });
    }

    const reportPermission =
      canGenerateReport(scan);

    if (
      !reportPermission.allowed
    ) {
      return response
        .status(409)
        .json({
          message:
            reportPermission.message,
        });
    }

    const generatedReport =
      generateScanReport({
        scan,

        format:
          report.format,
      });

    return sendGeneratedReport({
      response,
      generatedReport,
    });
  } catch (error) {
    console.error(
      "Unable to open exported report:",
      error,
    );

    return response
      .status(500)
      .json({
        message:
          error instanceof Error
            ? error.message
            : "The report could not be opened.",
      });
  }
}