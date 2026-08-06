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
import CorrelationFindingsModal from "../components/CorrelationFindingsModal";
import ExportReportModal from "../components/ExportReportModal";

import {
  getScan,
} from "../services/scanApi";

import "./ScanResultsPage.css";

function buildFallbackSummary(
  findings,
) {
  const summary = {
    total: findings.length,
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
    correlations: 0,
    highConfidenceCorrelations: 0,
  };

  for (
    const finding of findings
  ) {
    if (
      [
        "high",
        "medium",
        "low",
      ].includes(
        finding?.severity,
      )
    ) {
      summary[
        finding.severity
      ] += 1;
    }

    if (
      finding?.category ===
      "cookie"
    ) {
      summary.cookies += 1;
    }

    if (
      finding?.category ===
      "network"
    ) {
      summary.network += 1;
    }

    if (
      finding?.category ===
      "browser-storage"
    ) {
      summary.browserStorage += 1;
    }

    if (
      finding?.category ===
      "source-code"
    ) {
      summary.sourceCode += 1;
    }

    if (
      finding?.phase ===
      "pre-consent"
    ) {
      summary.preConsent += 1;
    }

    if (
      finding?.phase ===
      "post-rejection"
    ) {
      summary.postRejection += 1;
    }

    if (
      finding?.phase ===
      "post-acceptance"
    ) {
      summary.postAcceptance += 1;
    }
  }

  return summary;
}

function getOverallStatus(
  scan,
  findingsSummary,
) {
  if (
    scan?.status === "failed"
  ) {
    return "FAILED";
  }

  if (
    scan?.status === "pending" ||
    scan?.status === "running"
  ) {
    return "RUNNING";
  }

  if (
    (findingsSummary.high ??
      0) > 0 ||
    (findingsSummary.medium ??
      0) > 0 ||
    (findingsSummary.low ??
      0) > 0
  ) {
    return "WARNING";
  }

  return "PASSED";
}

function getConsentActionLabel(
  consentAction,
) {
  return consentAction ===
    "accept"
    ? "Accept All"
    : "Reject All";
}

function getScanModeLabel(
  scanMode,
) {
  if (
    scanMode === "hybrid"
  ) {
    return "Hybrid";
  }

  if (
    scanMode ===
    "source-code"
  ) {
    return "Source Code";
  }

  return "Runtime";
}

function deriveLegacyScanMode(
  scan,
) {
  if (scan?.scanMode) {
    return scan.scanMode;
  }

  const options =
    scan?.scanOptions ?? {};

  const hasRuntimeChecks =
    options.cookies === true ||
    options.networkRequests ===
      true ||
    options.browserStorage ===
      true;

  const hasSourceCodeCheck =
    options.sourceCode === true;

  if (
    hasRuntimeChecks &&
    hasSourceCodeCheck
  ) {
    return "hybrid";
  }

  if (hasSourceCodeCheck) {
    return "source-code";
  }

  return "runtime";
}

function ScanResultsPage() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const scanId =
    searchParams.get("scan");

  const [scan, setScan] =
    useState(null);

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

  const correlations =
    useMemo(
      () =>
        Array.isArray(
          scan?.correlations,
        )
          ? scan.correlations
          : [],
      [scan?.correlations],
    );

  const scanMode =
    useMemo(
      () =>
        deriveLegacyScanMode(
          scan,
        ),
      [scan],
    );

  const findingsSummary =
    useMemo(() => {
      const fallbackSummary =
        buildFallbackSummary(
          findings,
        );

      return {
        ...fallbackSummary,
        ...(scan?.findingsSummary ??
          {}),

        correlations:
          scan?.findingsSummary
            ?.correlations ??
          correlations.length,

        highConfidenceCorrelations:
          scan?.findingsSummary
            ?.highConfidenceCorrelations ??
          correlations.filter(
            (correlation) =>
              correlation
                ?.confidence ===
              "high",
          ).length,
      };
    }, [
      correlations,
      findings,
      scan?.findingsSummary,
    ]);

  const enabledResultTabs =
    useMemo(() => {
      const options =
        scan?.scanOptions ?? {};

      const tabs = [
        "Summary",
      ];

      if (
        options.cookies === true
      ) {
        tabs.push(
          "Cookies",
        );
      }

      if (
        options.networkRequests ===
        true
      ) {
        tabs.push(
          "Network",
        );
      }

      if (
        options.browserStorage ===
        true
      ) {
        tabs.push(
          "Storage",
        );
      }

      if (
        options.sourceCode === true
      ) {
        tabs.push(
          "Source code",
        );
      }

      if (
        scanMode === "hybrid" &&
        correlations.length > 0
      ) {
        tabs.push(
          "Correlations",
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
      correlations.length,
      findings.length,
      scan?.scanOptions,
      scanMode,
    ]);

  const overallStatus =
    getOverallStatus(
      scan,
      findingsSummary,
    );

  const isModalOpen =
    Boolean(activeModal);

  useEffect(() => {
    if (!scanId) {
      setIsLoading(false);

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

        setLoadError("");
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
      setActiveModal(null);
      setSelectedFinding(
        null,
      );
    }, []);

  useEffect(() => {
    document.body.style.overflow =
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
      document.body.style.overflow =
        "";

      document.removeEventListener(
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
      modalName !==
        "Export report" &&
      !enabledResultTabs.includes(
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
    navigate("/new-scan", {
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
          "",

        necessaryCookieAllowlist:
          scan
            ?.necessaryCookieAllowlist ??
          [],

        scanOptions:
          scan?.scanOptions ?? {
            cookies: true,
            networkRequests: true,
            browserStorage: true,
            sourceCode: false,
          },
      },
    });
  }

  function handleExportReport() {
    openModal(
      "Export report",
    );
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

  const resultTarget =
    scanMode ===
    "source-code"
      ? scan
          ?.sourceCodeFolder ||
        "Unknown source folder"
      : scan?.targetUrl ||
        "Unknown target";

  const canExport =
    scan?.status ===
      "completed" ||
    (
      scan?.status ===
        "failed" &&
      findings.length > 0
    );

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
            {resultTarget}
          </div>

          <div className="scan-overall-status">
            <span>
              Overall Status:
            </span>

            <strong
              className={`scan-status-${overallStatus.toLowerCase()}`}
            >
              {overallStatus}
            </strong>
          </div>

          <div className="scan-severity-summary">
            <span>
              High:{" "}
              {findingsSummary.high ??
                0}
            </span>

            <span>
              Medium:{" "}
              {findingsSummary.medium ??
                0}
            </span>

            <span>
              Low:{" "}
              {findingsSummary.low ??
                0}
            </span>
          </div>

          <div className="scan-result-details">
            <span>
              Scan mode:{" "}
              <strong>
                {getScanModeLabel(
                  scanMode,
                )}
              </strong>
            </span>

            {scanMode !==
              "source-code" && (
              <span>
                Consent action:{" "}
                <strong>
                  {getConsentActionLabel(
                    scan
                      ?.consentAction,
                  )}
                </strong>
              </span>
            )}

            <span>
              Findings:{" "}
              <strong>
                {findingsSummary.total ??
                  findings.length}
              </strong>
            </span>

            {scanMode ===
              "hybrid" && (
              <span>
                Correlations:{" "}
                <strong>
                  {
                    correlations.length
                  }
                </strong>
              </span>
            )}
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
              disabled={
                !canExport
              }
              title={
                canExport
                  ? "Export this scan"
                  : "Reports are available after a scan has completed"
              }
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
          findings={findings}
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
          findings={findings}
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
          findings={findings}
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
          findings={findings}
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
          findings={findings}
          onClose={
            closeAllModals
          }
          onViewFinding={
            openFindingGuidance
          }
        />
      )}

      {activeModal ===
        "Correlations" && (
        <CorrelationFindingsModal
          correlations={
            correlations
          }
          findings={findings}
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
          findings={findings}
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

      {activeModal ===
        "Export report" && (
        <ExportReportModal
          scan={scan}
          onClose={
            closeAllModals
          }
        />
      )}
    </DashboardLayout>
  );
}

export default ScanResultsPage;