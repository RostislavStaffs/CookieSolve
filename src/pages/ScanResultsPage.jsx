import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import ScanSummaryModal from "../components/ScanSummaryModal";
import CookieFindingsModal from "../components/CookieFindingsModal";
import NetworkFindingsModal from "../components/NetworkFindingsModal";
import SourceCodeFindingsModal from "../components/SourceCodeFindingsModal";
import BrowserStorageFindingsModal from "../components/BrowserStorageFindingsModal";
import FixGuidanceModal from "../components/FixGuidanceModal";

import {
  getScan,
} from "../services/scanApi";

import "./ScanResultsPage.css";

function buildFallbackSummary(
  findings,
) {
  const summary = {
    total:
      findings.length,

    high: 0,
    medium: 0,
    low: 0,

    cookies: 0,
    network: 0,
    browserStorage: 0,
    sourceCode: 0,

    preConsent: 0,
    postRejection: 0,
    postAcceptance: 0,

    reviewOnly: 0,
    actionable: 0,
  };

  for (
    const finding of findings
  ) {
    if (
      Object.prototype
        .hasOwnProperty
        .call(
          summary,
          finding.severity,
        )
    ) {
      summary[
        finding.severity
      ] += 1;
    }

    if (
      finding.category ===
      "cookie"
    ) {
      summary.cookies += 1;
    }

    if (
      finding.category ===
      "network"
    ) {
      summary.network += 1;
    }

    if (
      finding.category ===
      "browser-storage"
    ) {
      summary.browserStorage +=
        1;
    }

    if (
      finding.category ===
      "source-code"
    ) {
      summary.sourceCode += 1;
    }

    if (
      finding.phase ===
      "pre-consent"
    ) {
      summary.preConsent += 1;
    }

    if (
      finding.phase ===
      "post-rejection"
    ) {
      summary.postRejection +=
        1;
    }

    if (
      finding.phase ===
      "post-acceptance"
    ) {
      summary.postAcceptance +=
        1;
    }

    if (
      finding.category ===
        "source-code" &&
      finding.evidence
        ?.reviewOnly ===
        true
    ) {
      summary.reviewOnly += 1;
    } else {
      summary.actionable += 1;
    }
  }

  return summary;
}

function getScanMode(
  scan,
) {
  if (
    scan?.scanMode
  ) {
    return scan.scanMode;
  }

  const options =
    scan?.scanOptions ?? {};

  const hasRuntime =
    options.cookies !== false ||
    options.networkRequests !==
      false ||
    options.browserStorage !==
      false;

  const hasSource =
    options.sourceCode === true;

  if (
    hasRuntime &&
    hasSource
  ) {
    return "hybrid";
  }

  if (hasSource) {
    return "source-code";
  }

  return "runtime";
}

function getOverallStatus(
  scan,
  findings,
) {
  if (
    scan?.status ===
    "failed"
  ) {
    return "FAILED";
  }

  if (
    scan?.status ===
      "pending" ||
    scan?.status ===
      "running"
  ) {
    return "RUNNING";
  }

  const safeFindings =
    Array.isArray(findings)
      ? findings
      : [];

  const runtimeFindings =
    safeFindings.filter(
      (finding) =>
        finding.category !==
        "source-code",
    );

  const sourceFindings =
    safeFindings.filter(
      (finding) =>
        finding.category ===
        "source-code",
    );

  const actionableSourceFindings =
    sourceFindings.filter(
      (finding) =>
        finding.evidence
          ?.reviewOnly !==
        true,
    );

  const reviewOnlyFindings =
    sourceFindings.filter(
      (finding) =>
        finding.evidence
          ?.reviewOnly ===
        true,
    );

  /*
   * Runtime findings represent behaviour
   * that CookieSolve actually observed.
   */
  if (
    runtimeFindings.length >
    0
  ) {
    return "WARNING";
  }

  /*
   * Strong static findings still contribute
   * to a warning even if runtime did not
   * reproduce the issue during this scan.
   */
  if (
    actionableSourceFindings
      .length > 0
  ) {
    return "WARNING";
  }

  const scanMode =
    getScanMode(scan);

  /*
   * Clean runtime evidence plus uncertain
   * static evidence becomes a review state.
   */
  if (
    scanMode === "hybrid" &&
    reviewOnlyFindings.length >
      0
  ) {
    return "PASS WITH REVIEW";
  }

  /*
   * Source-only scans do not have runtime
   * evidence available to support or reject
   * uncertain static findings.
   */
  if (
    scanMode ===
      "source-code" &&
    reviewOnlyFindings.length >
      0
  ) {
    return "WARNING";
  }

  return "PASSED";
}

function getStatusClassName(
  status,
) {
  return (
    "scan-status-" +
    String(status)
      .toLowerCase()
      .replace(
        /\s+/g,
        "-",
      )
  );
}

function getConsentActionLabel(
  consentAction,
) {
  return (
    consentAction ===
      "accept"
      ? "Accept All"
      : "Reject All"
  );
}
function downloadBlob(
  content,
  mimeType,
  filename,
) {
  const blob = new Blob(
    [content],
    {
      type: mimeType,
    },
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(
    link,
  );

  link.click();

  document.body.removeChild(
    link,
  );

  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(
    value ?? "",
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function ScanResultsPage() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  const scanId =
    searchParams.get(
      "scan",
    );

  const [
    scan,
    setScan,
  ] = useState(null);

  const [
    isLoading,
    setIsLoading,
  ] = useState(
    Boolean(scanId),
  );

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    activeModal,
    setActiveModal,
  ] = useState(null);

  const [
    selectedFinding,
    setSelectedFinding,
  ] = useState(null);

  const findings =
    useMemo(
      () =>
        Array.isArray(
          scan?.findings,
        )
          ? scan.findings
          : [],
      [scan?.findings],
    );

  const findingsSummary =
    useMemo(() => {
      const fallbackSummary =
        buildFallbackSummary(
          findings,
        );

      return {
        ...fallbackSummary,

        ...(scan
          ?.findingsSummary ??
          {}),
      };
    }, [
      findings,
      scan?.findingsSummary,
    ]);

  const reviewOnlyCount =
    useMemo(
      () =>
        findings.filter(
          (finding) =>
            finding.category ===
              "source-code" &&
            finding.evidence
              ?.reviewOnly ===
              true,
        ).length,
      [findings],
    );

  const actionableCount =
    findings.length -
    reviewOnlyCount;

  const enabledResultTabs =
    useMemo(() => {
      const options =
        scan?.scanOptions ??
        {};

      const tabs = [
        "Summary",
      ];

      if (
        options.cookies !==
        false
      ) {
        tabs.push(
          "Cookies",
        );
      }

      if (
        options
          .networkRequests !==
        false
      ) {
        tabs.push(
          "Network",
        );
      }

      if (
        options
          .browserStorage !==
        false
      ) {
        tabs.push(
          "Storage",
        );
      }

      if (
        options.sourceCode ===
        true
      ) {
        tabs.push(
          "Source code",
        );
      }

      if (
        findings.length > 0
      ) {
        tabs.push(
          "Fix guidance",
        );
      }

      return tabs;
    }, [
      findings.length,
      scan?.scanOptions,
    ]);

  const overallStatus =
    getOverallStatus(
      scan,
      findings,
    );

  const isModalOpen =
    Boolean(activeModal);

  useEffect(() => {
    if (!scanId) {
      setIsLoading(
        false,
      );

      setLoadError(
        "No scan ID was provided.",
      );

      return undefined;
    }

    let componentMounted =
      true;

    async function loadScan() {
      try {
        const data =
          await getScan(
            scanId,
          );

        if (
          !componentMounted
        ) {
          return;
        }

        if (!data?.scan) {
          throw new Error(
            "The server did not return the scan results.",
          );
        }

        setScan(
          data.scan,
        );

        setLoadError(
          "",
        );
      } catch (error) {
        if (
          !componentMounted
        ) {
          return;
        }

        setLoadError(
          error.message ||
            "Unable to load the scan results.",
        );
      } finally {
        if (
          componentMounted
        ) {
          setIsLoading(
            false,
          );
        }
      }
    }

    loadScan();

    return () => {
      componentMounted =
        false;
    };
  }, [scanId]);

  const closeAllModals =
    useCallback(() => {
      setActiveModal(
        null,
      );

      setSelectedFinding(
        null,
      );
    }, []);

  useEffect(() => {
    document.body.style
      .overflow =
      isModalOpen
        ? "hidden"
        : "";

    function closeWithEscape(
      event,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        closeAllModals();
      }
    }

    document.addEventListener(
      "keydown",
      closeWithEscape,
    );

    return () => {
      document.body.style
        .overflow = "";

      document
        .removeEventListener(
          "keydown",
          closeWithEscape,
        );
    };
  }, [
    closeAllModals,
    isModalOpen,
  ]);

  function openModal(
    modalName,
  ) {
    if (
      !enabledResultTabs
        .includes(
          modalName,
        )
    ) {
      return;
    }

    setSelectedFinding(
      null,
    );

    setActiveModal(
      modalName,
    );
  }

  function openFindingGuidance(
    finding,
  ) {
    setSelectedFinding(
      finding,
    );

    setActiveModal(
      "Fix guidance",
    );
  }

  function handleRunAgain() {
    navigate(
      "/new-scan",
      {
        state: {
          targetUrl:
            scan?.targetUrl ??
            "",

          consentAction:
            scan
              ?.consentAction ??
            "reject",

          acceptSelector:
            scan
              ?.acceptSelector ??
            "#accept-all",

          rejectSelector:
            scan
              ?.rejectSelector ??
            "#reject-all",

          browser:
            scan?.browser ??
            "chromium",

          waitTime:
            scan?.waitTime ??
            3000,

          sourceFolder:
            scan
              ?.sourceCodeFolder ??
            "./src",

          necessaryCookieAllowlist:
            scan
              ?.necessaryCookieAllowlist ??
            [],

          necessaryStorageAllowlist:
            scan
              ?.necessaryStorageAllowlist ??
            [],

          scanOptions:
            scan
              ?.scanOptions ?? {
              cookies: true,

              networkRequests:
                true,

              browserStorage:
                true,

              sourceCode:
                false,
            },
        },
      },
    );
  }

  function handleExportReport() {
  if (!scan) {
    console.error(
      "No scan available to export.",
    );
    return;
  }

  let reportFormats = [
    "html",
  ];

  try {
    const savedSettings =
      window.localStorage.getItem(
        "cookiesolve-settings",
      );

    if (savedSettings) {
      const parsedSettings =
        JSON.parse(
          savedSettings,
        );

      if (
        Array.isArray(
          parsedSettings
            ?.reportFormats,
        ) &&
        parsedSettings
          .reportFormats
          .length > 0
      ) {
        reportFormats =
          parsedSettings.reportFormats;
      }
    }
  } catch (error) {
    console.error(
      "Could not read report settings:",
      error,
    );
  }

  const scanId =
    scan._id ?? "scan";

  const reportData = {
    scanId,
    targetUrl:
      scan.targetUrl ?? "",
    overallStatus,
    consentAction:
      getConsentActionLabel(
        scan.consentAction,
      ),
    scanMode:
      getScanMode(scan),
    browser:
      scan.browser ??
      "chromium",
    waitTime:
      scan.waitTime ??
      3000,
    scanOptions:
      scan.scanOptions ?? {},
    findingsSummary,
    findings,
    generatedAt:
      new Date().toISOString(),
  };

  if (
    reportFormats.includes(
      "json",
    )
  ) {
    const json =
      JSON.stringify(
        reportData,
        null,
        2,
      );

    downloadBlob(
      json,
      "application/json;charset=utf-8",
      `cookiesolve-report-${scanId}.json`,
    );
  }

  if (
    reportFormats.includes(
      "html",
    )
  ) {
    const findingCards =
      findings.length > 0
        ? findings
            .map(
              (
                finding,
                index,
              ) => {
                const severity =
                  String(
                    finding.severity ??
                      "low",
                  ).toLowerCase();

                return `
                  <article class="finding">
                    <header class="finding-header">
                      <div>
                        <span class="finding-number">
                          Finding ${
                            index + 1
                          }
                        </span>

                        <h3>
                          ${escapeHtml(
                            finding.title ??
                              finding.message ??
                              "Finding",
                          )}
                        </h3>
                      </div>

                      <span
                        class="severity severity-${severity}"
                      >
                        ${escapeHtml(
                          severity,
                        )}
                      </span>
                    </header>

                    <dl class="finding-meta">
                      <div>
                        <dt>
                          Category
                        </dt>

                        <dd>
                          ${escapeHtml(
                            finding.category,
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Phase
                        </dt>

                        <dd>
                          ${escapeHtml(
                            finding.phase,
                          )}
                        </dd>
                      </div>

                      <div>
                        <dt>
                          Rule/type
                        </dt>

                        <dd>
                          ${escapeHtml(
                            finding.ruleId ??
                              finding.rule ??
                              finding.type ??
                              "",
                          )}
                        </dd>
                      </div>
                    </dl>

                    ${
                      finding.description ??
                      finding.message
                        ? `
                          <p class="finding-description">
                            ${escapeHtml(
                              finding.description ??
                                finding.message,
                            )}
                          </p>
                        `
                        : ""
                    }

                    ${
                      finding.evidence
                        ? `
                          <details>
                            <summary>
                              Technical evidence
                            </summary>

                            <pre>${escapeHtml(
                              JSON.stringify(
                                finding.evidence,
                                null,
                                2,
                              ),
                            )}</pre>
                          </details>
                        `
                        : ""
                    }
                  </article>
                `;
              },
            )
            .join("")
        : `
          <div class="empty-state">
            No technical findings were recorded.
          </div>
        `;

    const html = `
<!DOCTYPE html>
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

    .finding {
      padding: 20px;

      border: 1px solid
        rgba(255, 255, 255, 0.08);

      border-radius: 14px;

      background: #111015;
    }

    .finding + .finding {
      margin-top: 14px;
    }

    .finding-header {
      display: flex;

      align-items: flex-start;
      justify-content: space-between;

      gap: 20px;
    }

    .finding-number {
      color: #7888ff;

      font-size: 10px;

      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .finding h3 {
      margin: 6px 0 0;

      font-size: 16px;
      line-height: 1.45;
    }

    .severity {
      flex: 0 0 auto;

      padding: 5px 9px;

      border-radius: 999px;

      font-size: 10px;

      text-transform: capitalize;
    }

    .severity-high {
      border: 1px solid
        rgba(255, 78, 96, 0.27);

      background:
        rgba(226, 43, 61, 0.12);

      color: #ff8995;
    }

    .severity-medium {
      border: 1px solid
        rgba(241, 170, 65, 0.26);

      background:
        rgba(213, 138, 29, 0.11);

      color: #f0bd72;
    }

    .severity-low {
      border: 1px solid
        rgba(92, 117, 255, 0.25);

      background:
        rgba(54, 78, 207, 0.11);

      color: #9aa9ff;
    }

    .finding-meta {
      margin: 17px 0 0;

      display: grid;

      grid-template-columns:
        repeat(
          auto-fit,
          minmax(150px, 1fr)
        );

      gap: 10px;
    }

    .finding-meta div {
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

    .finding-description {
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
        ${escapeHtml(
          scan.targetUrl,
        )}
      </p>

      <div class="status-row">
        <span class="pill">
          Status:
          <strong>
            ${escapeHtml(
              overallStatus,
            )}
          </strong>
        </span>

        <span class="pill">
          Mode:
          <strong>
            ${escapeHtml(
              getScanMode(scan),
            )}
          </strong>
        </span>

        <span class="pill">
          Generated:
          <strong>
            ${escapeHtml(
              new Date().toLocaleString(
                "en-GB",
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
        <article class="summary-card">
          <span>Total findings</span>

          <strong>
            ${findingsSummary.total}
          </strong>
        </article>

        <article class="summary-card">
          <span>High severity</span>

          <strong>
            ${findingsSummary.high}
          </strong>
        </article>

        <article class="summary-card">
          <span>Medium severity</span>

          <strong>
            ${findingsSummary.medium}
          </strong>
        </article>

        <article class="summary-card">
          <span>Low severity</span>

          <strong>
            ${findingsSummary.low}
          </strong>
        </article>

        <article class="summary-card">
          <span>Cookie findings</span>

          <strong>
            ${findingsSummary.cookies}
          </strong>
        </article>

        <article class="summary-card">
          <span>Network findings</span>

          <strong>
            ${findingsSummary.network}
          </strong>
        </article>

        <article class="summary-card">
          <span>Storage findings</span>

          <strong>
            ${
              findingsSummary
                .browserStorage
            }
          </strong>
        </article>

        <article class="summary-card">
          <span>Source-code findings</span>

          <strong>
            ${findingsSummary.sourceCode}
          </strong>
        </article>
      </div>
    </section>

    <section>
      <h2>
        Scan Configuration
      </h2>

      <table>
        <tbody>
          <tr>
            <th>Scan ID</th>

            <td>
              ${escapeHtml(scanId)}
            </td>
          </tr>

          <tr>
            <th>Scan mode</th>

            <td>
              ${escapeHtml(
                getScanMode(scan),
              )}
            </td>
          </tr>

          <tr>
            <th>Overall status</th>

            <td>
              ${escapeHtml(
                overallStatus,
              )}
            </td>
          </tr>

          <tr>
            <th>Target</th>

            <td>
              ${escapeHtml(
                scan.targetUrl,
              )}
            </td>
          </tr>

          <tr>
            <th>Consent action</th>

            <td>
              ${escapeHtml(
                getConsentActionLabel(
                  scan.consentAction,
                ),
              )}
            </td>
          </tr>

          <tr>
            <th>Browser</th>

            <td>
              ${escapeHtml(
                scan.browser ??
                  "chromium",
              )}
            </td>
          </tr>

          <tr>
            <th>Wait time</th>

            <td>
              ${escapeHtml(
                `${
                  scan.waitTime ??
                  3000
                } ms`,
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section>
      <h2>
        Technical Findings
      </h2>

      ${findingCards}
    </section>

    <footer class="report-footer">
      <p>
        CookieSolve provides technical
        evidence and developer guidance.
        Findings do not independently
        establish legal non-compliance.
      </p>

      <p>
        Report generated by CookieSolve.
      </p>
    </footer>
  </main>
</body>
</html>
    `;

    downloadBlob(
      html,
      "text/html;charset=utf-8",
      `cookiesolve-report-${scanId}.html`,
    );
  }
}

  if (isLoading) {
    return (
      <DashboardLayout
        activePage="New Scan"
        title="New Scan"
      >
        <section className="scan-results-page">
          <h1>
            Scan Results
          </h1>

          <article className="scan-results-card">
            <div className="scan-results-loading">
              <span className="scan-loading-ring" />

              <p>
                Loading scan results...
              </p>
            </div>
          </article>
        </section>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout
        activePage="New Scan"
        title="New Scan"
      >
        <section className="scan-results-page">
          <h1>
            Scan Results
          </h1>

          <article className="scan-results-card">
            <div className="scan-results-error">
              <h2>
                Results unavailable
              </h2>

              <p>
                {loadError}
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/scan-history",
                  )
                }
              >
                Return to Scan History
              </button>
            </div>
          </article>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      activePage="New Scan"
      title="New Scan"
    >
      <section className="scan-results-page">
        <h1>
          Scan Results
        </h1>

        <article className="scan-results-card">
          <h2>
            Scan Results
          </h2>

          <div className="scan-result-url">
            {scan?.targetUrl ||
              "Unknown target"}
          </div>

          <div className="scan-overall-status">
            <span>
              Overall Status:
            </span>

            <strong
              className={
                getStatusClassName(
                  overallStatus,
                )
              }
            >
              {overallStatus}
            </strong>
          </div>

          {overallStatus ===
            "PASS WITH REVIEW" && (
            <p className="scan-review-status-message">
              Runtime testing did not observe an issue, but some source-code findings could not be confirmed automatically and should be reviewed.
            </p>
          )}

          <div className="scan-severity-summary">
            <span>
              High:{" "}
              {findingsSummary
                .high ?? 0}
            </span>

            <span>
              Medium:{" "}
              {findingsSummary
                .medium ?? 0}
            </span>

            <span>
              Low:{" "}
              {findingsSummary
                .low ?? 0}
            </span>
          </div>

          <div className="scan-result-details">
            <span>
              Consent action:{" "}
              <strong>
                {getConsentActionLabel(
                  scan
                    ?.consentAction,
                )}
              </strong>
            </span>

            <span>
              Findings:{" "}
              <strong>
                {findingsSummary
                  .total ??
                  findings.length}
              </strong>
            </span>

            {reviewOnlyCount >
              0 && (
              <span>
                Review findings:{" "}
                <strong>
                  {
                    reviewOnlyCount
                  }
                </strong>
              </span>
            )}

            <span>
              Actionable findings:{" "}
              <strong>
                {
                  actionableCount
                }
              </strong>
            </span>
          </div>

          <div className="scan-result-actions">
            <button
              type="button"
              onClick={
                handleRunAgain
              }
            >
              Run again
            </button>

            <button
              type="button"
              onClick={
                handleExportReport
              }
            >
              Export Report
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/new-scan",
                )
              }
            >
              New Scan
            </button>
          </div>

          <section className="scan-tabs-section">
            <h3>
              Tabs:
            </h3>

            <div
              className="scan-result-tabs"
              role="tablist"
              aria-label="Scan result categories"
            >
              {enabledResultTabs.map(
                (tab) => (
                  <button
                    className={
                      activeModal ===
                      tab
                        ? "scan-result-tab active"
                        : "scan-result-tab"
                    }
                    type="button"
                    role="tab"
                    aria-selected={
                      activeModal ===
                      tab
                    }
                    key={tab}
                    onClick={() =>
                      openModal(
                        tab,
                      )
                    }
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>
          </section>
        </article>
      </section>

      {activeModal ===
        "Summary" && (
        <ScanSummaryModal
          scan={scan}
          findings={
            findings
          }
          findingsSummary={
            findingsSummary
          }
          overallStatus={
            overallStatus
          }
          onClose={
            closeAllModals
          }
          onViewCookies={() =>
            openModal(
              "Cookies",
            )
          }
          onViewNetwork={() =>
            openModal(
              "Network",
            )
          }
          onViewSourceCode={() =>
            openModal(
              "Source code",
            )
          }
        />
      )}

      {activeModal ===
        "Cookies" && (
        <CookieFindingsModal
          scan={scan}
          findings={
            findings
          }
          onClose={
            closeAllModals
          }
          onViewFinding={
            openFindingGuidance
          }
        />
      )}

      {activeModal ===
        "Network" && (
        <NetworkFindingsModal
          findings={
            findings
          }
          onClose={
            closeAllModals
          }
          onViewFinding={
            openFindingGuidance
          }
        />
      )}

      {activeModal ===
        "Storage" && (
        <BrowserStorageFindingsModal
          findings={
            findings
          }
          onClose={
            closeAllModals
          }
          onViewFinding={
            openFindingGuidance
          }
        />
      )}

      {activeModal ===
        "Source code" && (
        <SourceCodeFindingsModal
          scan={scan}
          findings={
            findings
          }
          onClose={
            closeAllModals
          }
          onViewFinding={
            openFindingGuidance
          }
        />
      )}

      {activeModal ===
        "Fix guidance" && (
        <FixGuidanceModal
          scan={scan}
          finding={
            selectedFinding
          }
          findings={
            findings
          }
          onClose={
            closeAllModals
          }
          onRunAgain={
            handleRunAgain
          }
          onExportResults={
            handleExportReport
          }
        />
      )}
    </DashboardLayout>
  );
}

export default ScanResultsPage;