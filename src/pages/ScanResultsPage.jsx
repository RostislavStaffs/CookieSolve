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
    console.log(
      "Export report for scan:",
      scan?._id,
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