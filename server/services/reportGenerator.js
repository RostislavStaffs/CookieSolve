function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

function formatBoolean(value) {
  return value ? "Enabled" : "Disabled";
}

function formatScanMode(scanMode) {
  if (scanMode === "source-code") {
    return "Source-code analysis";
  }

  if (scanMode === "hybrid") {
    return "Hybrid runtime and source-code analysis";
  }

  return "Runtime browser analysis";
}

function formatConsentAction(consentAction) {
  return consentAction === "accept"
    ? "Accept All"
    : "Reject All";
}

function getReportTarget(scan) {
  if (scan.scanMode === "source-code") {
    return scan.sourceCodeFolder || "Unknown source folder";
  }

  return scan.targetUrl || "Unknown target";
}

function getOverallStatus(scan) {
  if (scan.status === "failed") {
    return "FAILED";
  }

  if (
    scan.status === "pending" ||
    scan.status === "running"
  ) {
    return "IN PROGRESS";
  }

  const summary =
    scan.findingsSummary ?? {};

  if (
    Number(summary.high ?? 0) > 0 ||
    Number(summary.medium ?? 0) > 0 ||
    Number(summary.low ?? 0) > 0
  ) {
    return "WARNING";
  }

  return "PASSED";
}

function getSafeFindings(scan) {
  return Array.isArray(scan.findings)
    ? scan.findings
    : [];
}

function getSafeCorrelations(scan) {
  return Array.isArray(scan.correlations)
    ? scan.correlations
    : [];
}

function normaliseScanOptions(scanOptions = {}) {
  return {
    cookies:
      scanOptions.cookies === true,

    networkRequests:
      scanOptions.networkRequests === true,

    browserStorage:
      scanOptions.browserStorage === true,

    sourceCode:
      scanOptions.sourceCode === true,
  };
}

function createReportData(scan) {
  const scanObject =
    typeof scan.toObject === "function"
      ? scan.toObject()
      : scan;

  const findings =
    getSafeFindings(scanObject);

  const correlations =
    getSafeCorrelations(scanObject);

  const scanOptions =
    normaliseScanOptions(
      scanObject.scanOptions,
    );

  return {
    report: {
      name: "CookieSolve Scan Report",
      generatedAt:
        new Date().toISOString(),

      disclaimer:
        "CookieSolve provides technical evidence and developer guidance. " +
        "Findings and correlations do not independently establish legal non-compliance.",
    },

    scan: {
      id: String(
        scanObject._id ??
          scanObject.id ??
          "",
      ),

      mode:
        scanObject.scanMode ??
        "runtime",

      modeLabel:
        formatScanMode(
          scanObject.scanMode,
        ),

      status:
        scanObject.status ??
        "unknown",

      overallStatus:
        getOverallStatus(
          scanObject,
        ),

      target:
        getReportTarget(
          scanObject,
        ),

      targetUrl:
        scanObject.targetUrl ??
        "",

      sourceCodeFolder:
        scanObject.sourceCodeFolder ??
        "",

      consentAction:
        scanObject.consentAction ??
        "reject",

      consentActionLabel:
        formatConsentAction(
          scanObject.consentAction,
        ),

      acceptSelector:
        scanObject.acceptSelector ??
        "",

      rejectSelector:
        scanObject.rejectSelector ??
        "",

      browser:
        scanObject.browser ??
        "",

      waitTime:
        scanObject.waitTime ??
        0,

      scanOptions,

      necessaryCookieAllowlist:
        Array.isArray(
          scanObject
            .necessaryCookieAllowlist,
        )
          ? scanObject
              .necessaryCookieAllowlist
          : [],

      createdAt:
        scanObject.createdAt ??
        null,

      startedAt:
        scanObject.startedAt ??
        null,

      completedAt:
        scanObject.completedAt ??
        null,

      errorMessage:
        scanObject.errorMessage ??
        "",
    },

    summary: {
      total:
        scanObject.findingsSummary
          ?.total ??
        findings.length,

      high:
        scanObject.findingsSummary
          ?.high ??
        findings.filter(
          (finding) =>
            finding.severity === "high",
        ).length,

      medium:
        scanObject.findingsSummary
          ?.medium ??
        findings.filter(
          (finding) =>
            finding.severity ===
            "medium",
        ).length,

      low:
        scanObject.findingsSummary
          ?.low ??
        findings.filter(
          (finding) =>
            finding.severity === "low",
        ).length,

      cookies:
        scanObject.findingsSummary
          ?.cookies ??
        findings.filter(
          (finding) =>
            finding.category ===
            "cookie",
        ).length,

      network:
        scanObject.findingsSummary
          ?.network ??
        findings.filter(
          (finding) =>
            finding.category ===
            "network",
        ).length,

      browserStorage:
        scanObject.findingsSummary
          ?.browserStorage ??
        findings.filter(
          (finding) =>
            finding.category ===
            "browser-storage",
        ).length,

      sourceCode:
        scanObject.findingsSummary
          ?.sourceCode ??
        findings.filter(
          (finding) =>
            finding.category ===
            "source-code",
        ).length,

      correlations:
        scanObject.findingsSummary
          ?.correlations ??
        correlations.length,

      highConfidenceCorrelations:
        scanObject.findingsSummary
          ?.highConfidenceCorrelations ??
        correlations.filter(
          (correlation) =>
            correlation.confidence ===
            "high",
        ).length,
    },

    findings,

    correlations,

    runtimeEvidence: {
      preConsent:
        scanObject.preConsent ?? {
          cookies: [],
          networkRequests: [],
          browserStorage: [],
        },

      postAction:
        scanObject.postAction ?? {
          cookies: [],
          networkRequests: [],
          browserStorage: [],
        },
    },
  };
}

function createFilename(scan, extension) {
  const scanId = String(
    scan._id ?? scan.id ?? "scan",
  ).slice(-8);

  const date =
    new Date()
      .toISOString()
      .slice(0, 10);

  return (
    `cookiesolve-report-${date}-${scanId}` +
    `.${extension}`
  );
}

function renderSummaryCards(summary) {
  const cards = [
    ["Total findings", summary.total],
    ["High severity", summary.high],
    ["Medium severity", summary.medium],
    ["Low severity", summary.low],
    ["Cookie findings", summary.cookies],
    ["Network findings", summary.network],
    [
      "Storage findings",
      summary.browserStorage,
    ],
    [
      "Source-code findings",
      summary.sourceCode,
    ],
    [
      "Correlations",
      summary.correlations,
    ],
  ];

  return cards
    .map(
      ([label, value]) => `
        <article class="summary-card">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </article>
      `,
    )
    .join("");
}

function renderConfiguration(reportData) {
  const { scan } = reportData;

  const rows = [
    ["Scan ID", scan.id],
    ["Scan mode", scan.modeLabel],
    ["Overall status", scan.overallStatus],
    ["Target", scan.target],
    [
      "Consent action",
      scan.mode === "source-code"
        ? "Not applicable"
        : scan.consentActionLabel,
    ],
    [
      "Browser",
      scan.mode === "source-code"
        ? "Not applicable"
        : scan.browser,
    ],
    [
      "Wait time",
      scan.mode === "source-code"
        ? "Not applicable"
        : `${scan.waitTime} ms`,
    ],
    [
      "Cookie checks",
      formatBoolean(
        scan.scanOptions.cookies,
      ),
    ],
    [
      "Network checks",
      formatBoolean(
        scan.scanOptions
          .networkRequests,
      ),
    ],
    [
      "Browser-storage checks",
      formatBoolean(
        scan.scanOptions
          .browserStorage,
      ),
    ],
    [
      "Source-code checks",
      formatBoolean(
        scan.scanOptions.sourceCode,
      ),
    ],
    [
      "Created",
      formatDate(scan.createdAt),
    ],
    [
      "Started",
      formatDate(scan.startedAt),
    ],
    [
      "Completed",
      formatDate(scan.completedAt),
    ],
  ];

  return rows
    .map(
      ([label, value]) => `
        <tr>
          <th>${escapeHtml(label)}</th>
          <td>${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join("");
}

function renderEvidence(evidence) {
  if (
    evidence === null ||
    evidence === undefined
  ) {
    return "No evidence provided";
  }

  if (
    typeof evidence === "string"
  ) {
    return evidence;
  }

  try {
    return JSON.stringify(
      evidence,
      null,
      2,
    );
  } catch {
    return String(evidence);
  }
}

function renderFindings(findings) {
  if (findings.length === 0) {
    return `
      <div class="empty-state">
        No findings were recorded for this scan.
      </div>
    `;
  }

  return findings
    .map(
      (finding, index) => `
        <article class="finding">
          <header class="finding-header">
            <div>
              <span class="finding-number">
                Finding ${index + 1}
              </span>

              <h3>
                ${escapeHtml(
                  finding.title ||
                    "Untitled finding",
                )}
              </h3>
            </div>

            <span class="severity severity-${escapeHtml(
              finding.severity ||
                "low",
            )}">
              ${escapeHtml(
                finding.severity ||
                  "low",
              )}
            </span>
          </header>

          <dl class="finding-meta">
            <div>
              <dt>Category</dt>
              <dd>${escapeHtml(
                finding.category ||
                  "Unknown",
              )}</dd>
            </div>

            <div>
              <dt>Phase</dt>
              <dd>${escapeHtml(
                finding.phase ||
                  "Unknown",
              )}</dd>
            </div>

            <div>
              <dt>Rule/type</dt>
              <dd>${escapeHtml(
                finding.type ||
                  "Unknown",
              )}</dd>
            </div>
          </dl>

          <p class="finding-description">
            ${escapeHtml(
              finding.description ||
                "",
            )}
          </p>

          <details>
            <summary>
              Technical evidence
            </summary>

            <pre>${escapeHtml(
              renderEvidence(
                finding.evidence,
              ),
            )}</pre>
          </details>
        </article>
      `,
    )
    .join("");
}

function renderCorrelations(
  correlations,
) {
  if (correlations.length === 0) {
    return `
      <div class="empty-state">
        No runtime–source correlations were recorded.
      </div>
    `;
  }

  return correlations
    .map(
      (correlation, index) => `
        <article class="correlation">
          <header>
            <div>
              <span>
                Correlation ${index + 1}
              </span>

              <h3>
                ${escapeHtml(
                  correlation.runtimeTitle ||
                    "Runtime finding",
                )}
                <span class="correlation-arrow">
                  →
                </span>
                ${escapeHtml(
                  correlation.sourceTitle ||
                    "Source finding",
                )}
              </h3>
            </div>

            <span class="confidence confidence-${escapeHtml(
              correlation.confidence ||
                "low",
            )}">
              ${escapeHtml(
                correlation.confidence ||
                  "low",
              )} confidence
            </span>
          </header>

          <p>
            ${escapeHtml(
              correlation.explanation ||
                "",
            )}
          </p>

          <dl class="correlation-meta">
            <div>
              <dt>Source file</dt>
              <dd>${escapeHtml(
                correlation.sourceFile ||
                  "Unknown",
              )}</dd>
            </div>

            <div>
              <dt>Source line</dt>
              <dd>${escapeHtml(
                correlation.sourceLine ??
                  "Unknown",
              )}</dd>
            </div>

            <div>
              <dt>Score</dt>
              <dd>${escapeHtml(
                correlation.score ?? 0,
              )}</dd>
            </div>
          </dl>

          ${
            Array.isArray(
              correlation.matchedIndicators,
            ) &&
            correlation
              .matchedIndicators.length >
              0
              ? `
                <div class="indicator-list">
                  ${correlation.matchedIndicators
                    .map(
                      (indicator) => `
                        <span>
                          ${escapeHtml(
                            indicator,
                          )}
                        </span>
                      `,
                    )
                    .join("")}
                </div>
              `
              : ""
          }
        </article>
      `,
    )
    .join("");
}

function createHtmlReport(
  reportData,
) {
  const {
    report,
    scan,
    summary,
    findings,
    correlations,
  } = reportData;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    CookieSolve Scan Report
  </title>

  <style>
    :root {
      color-scheme: dark;

      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      background: #0e0d12;
      color: #f5f4f7;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 48px 24px;

      background:
        radial-gradient(
          circle at top,
          rgba(65, 83, 220, 0.11),
          transparent 32%
        ),
        #0e0d12;
    }

    main {
      width: min(1120px, 100%);
      margin: 0 auto;
    }

    .report-header {
      padding: 34px;

      border: 1px solid
        rgba(119, 132, 255, 0.16);
      border-radius: 22px;

      background: #17161c;

      box-shadow:
        0 24px 70px
          rgba(0, 0, 0, 0.32);
    }

    .eyebrow {
      margin: 0 0 8px;

      color: #8391ff;

      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;

      font-size: clamp(
        28px,
        5vw,
        42px
      );

      letter-spacing: -0.04em;
    }

    .report-target {
      margin: 13px 0 0;

      color: #acaab3;

      overflow-wrap: anywhere;
    }

    .status-row {
      margin-top: 24px;

      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .pill {
      padding: 7px 11px;

      border: 1px solid
        rgba(255, 255, 255, 0.1);
      border-radius: 999px;

      background:
        rgba(255, 255, 255, 0.035);
      color: #c9c7cf;

      font-size: 12px;
    }

    .pill strong {
      color: #ffffff;
    }

    section {
      margin-top: 25px;
      padding: 28px;

      border: 1px solid
        rgba(255, 255, 255, 0.08);
      border-radius: 18px;

      background: #17161c;
    }

    section > h2 {
      margin: 0 0 20px;

      font-size: 21px;
      letter-spacing: -0.025em;
    }

    .summary-grid {
      display: grid;
      grid-template-columns:
        repeat(
          auto-fit,
          minmax(150px, 1fr)
        );
      gap: 12px;
    }

    .summary-card {
      min-height: 102px;
      padding: 16px;

      display: flex;
      flex-direction: column;
      justify-content: space-between;

      border: 1px solid
        rgba(96, 113, 245, 0.13);
      border-radius: 13px;

      background:
        rgba(61, 78, 190, 0.05);
    }

    .summary-card span {
      color: #92909a;

      font-size: 12px;
    }

    .summary-card strong {
      color: #ffffff;

      font-size: 28px;
    }

    table {
      width: 100%;

      border-collapse: collapse;
    }

    th,
    td {
      padding: 13px 14px;

      border-top: 1px solid
        rgba(255, 255, 255, 0.07);

      text-align: left;
      vertical-align: top;
    }

    tr:first-child th,
    tr:first-child td {
      border-top: 0;
    }

    th {
      width: 230px;

      color: #92909a;

      font-size: 12px;
      font-weight: 500;
    }

    td {
      color: #e0dfe4;

      font-size: 13px;
      overflow-wrap: anywhere;
    }

    .finding,
    .correlation {
      padding: 20px;

      border: 1px solid
        rgba(255, 255, 255, 0.08);
      border-radius: 14px;

      background: #111015;
    }

    .finding + .finding,
    .correlation + .correlation {
      margin-top: 14px;
    }

    .finding-header,
    .correlation header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 20px;
    }

    .finding-number,
    .correlation header span:first-child {
      color: #7888ff;

      font-size: 10px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .finding h3,
    .correlation h3 {
      margin: 6px 0 0;

      font-size: 16px;
      line-height: 1.45;
    }

    .severity,
    .confidence {
      flex: 0 0 auto;
      padding: 5px 9px;

      border-radius: 999px;

      font-size: 10px;
      text-transform: capitalize;
    }

    .severity-high,
    .confidence-high {
      border: 1px solid
        rgba(255, 78, 96, 0.27);

      background:
        rgba(226, 43, 61, 0.12);
      color: #ff8995;
    }

    .severity-medium,
    .confidence-medium {
      border: 1px solid
        rgba(241, 170, 65, 0.26);

      background:
        rgba(213, 138, 29, 0.11);
      color: #f0bd72;
    }

    .severity-low,
    .confidence-low {
      border: 1px solid
        rgba(92, 117, 255, 0.25);

      background:
        rgba(54, 78, 207, 0.11);
      color: #9aa9ff;
    }

    .finding-meta,
    .correlation-meta {
      margin: 17px 0 0;

      display: grid;
      grid-template-columns:
        repeat(
          auto-fit,
          minmax(150px, 1fr)
        );
      gap: 10px;
    }

    .finding-meta div,
    .correlation-meta div {
      padding: 11px;

      border-radius: 9px;

      background:
        rgba(255, 255, 255, 0.025);
    }

    dt {
      color: #7f7d87;

      font-size: 10px;
      text-transform: uppercase;
    }

    dd {
      margin: 5px 0 0;

      color: #d7d5dc;

      font-size: 12px;
      overflow-wrap: anywhere;
    }

    .finding-description,
    .correlation p {
      margin: 16px 0 0;

      color: #aaa8b1;

      font-size: 13px;
      line-height: 1.65;
    }

    details {
      margin-top: 16px;
    }

    summary {
      color: #8493ff;

      font-size: 12px;

      cursor: pointer;
    }

    pre {
      max-height: 390px;
      margin: 12px 0 0;
      padding: 15px;

      overflow: auto;

      border: 1px solid
        rgba(255, 255, 255, 0.07);
      border-radius: 10px;

      background: #0c0b0f;
      color: #d9d7df;

      font-family:
        ui-monospace,
        SFMono-Regular,
        Menlo,
        Consolas,
        monospace;

      font-size: 11px;
      line-height: 1.55;

      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .correlation-arrow {
      padding: 0 5px;

      color: #7183ff;
    }

    .indicator-list {
      margin-top: 14px;

      display: flex;
      flex-wrap: wrap;
      gap: 7px;
    }

    .indicator-list span {
      padding: 4px 8px;

      border: 1px solid
        rgba(95, 112, 245, 0.16);
      border-radius: 999px;

      background:
        rgba(67, 84, 207, 0.07);
      color: #a4adff;

      font-size: 10px;
    }

    .empty-state {
      padding: 35px;

      border: 1px dashed
        rgba(255, 255, 255, 0.1);
      border-radius: 12px;

      color: #8e8c96;

      text-align: center;
    }

    .report-footer {
      margin-top: 25px;
      padding: 20px 5px;

      color: #74727c;

      font-size: 11px;
      line-height: 1.6;
      text-align: center;
    }

    @media print {
      :root {
        color-scheme: light;
      }

      body {
        padding: 0;

        background: white;
        color: black;
      }

      .report-header,
      section,
      .finding,
      .correlation {
        border-color: #dddddd;

        background: white;
        color: black;

        box-shadow: none;
      }

      .report-target,
      td,
      dd,
      .finding-description,
      .correlation p {
        color: #333333;
      }

      pre {
        border-color: #dddddd;

        background: #f7f7f7;
        color: #111111;
      }
    }

    @media (max-width: 620px) {
      body {
        padding: 20px 12px;
      }

      .report-header,
      section {
        padding: 21px;
      }

      .finding-header,
      .correlation header {
        flex-direction: column;
      }

      th {
        width: 135px;
      }
    }
  </style>
</head>

<body>
  <main>
    <header class="report-header">
      <p class="eyebrow">
        CookieSolve
      </p>

      <h1>
        Scan Report
      </h1>

      <p class="report-target">
        ${escapeHtml(scan.target)}
      </p>

      <div class="status-row">
        <span class="pill">
          Status:
          <strong>
            ${escapeHtml(
              scan.overallStatus,
            )}
          </strong>
        </span>

        <span class="pill">
          Mode:
          <strong>
            ${escapeHtml(
              scan.modeLabel,
            )}
          </strong>
        </span>

        <span class="pill">
          Generated:
          <strong>
            ${escapeHtml(
              formatDate(
                report.generatedAt,
              ),
            )}
          </strong>
        </span>
      </div>
    </header>

    <section>
      <h2>
        Findings Summary
      </h2>

      <div class="summary-grid">
        ${renderSummaryCards(
          summary,
        )}
      </div>
    </section>

    <section>
      <h2>
        Scan Configuration
      </h2>

      <table>
        <tbody>
          ${renderConfiguration(
            reportData,
          )}
        </tbody>
      </table>
    </section>

    <section>
      <h2>
        Technical Findings
      </h2>

      ${renderFindings(findings)}
    </section>

    ${
      scan.mode === "hybrid"
        ? `
          <section>
            <h2>
              Runtime–Source Correlations
            </h2>

            ${renderCorrelations(
              correlations,
            )}
          </section>
        `
        : ""
    }

    <footer class="report-footer">
      <p>
        ${escapeHtml(
          report.disclaimer,
        )}
      </p>

      <p>
        Report generated by CookieSolve on
        ${escapeHtml(
          formatDate(
            report.generatedAt,
          ),
        )}.
      </p>
    </footer>
  </main>
</body>
</html>`;
}

export function generateScanReport({
  scan,
  format,
}) {
  const reportData =
    createReportData(scan);

  if (format === "json") {
    return {
      filename:
        createFilename(
          scan,
          "json",
        ),

      contentType:
        "application/json; charset=utf-8",

      content:
        JSON.stringify(
          reportData,
          null,
          2,
        ),
    };
  }

  if (format === "html") {
    return {
      filename:
        createFilename(
          scan,
          "html",
        ),

      contentType:
        "text/html; charset=utf-8",

      content:
        createHtmlReport(
          reportData,
        ),
    };
  }

  throw new Error(
    "The requested report format is not supported.",
  );
}