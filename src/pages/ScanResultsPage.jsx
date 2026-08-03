import { useEffect, useState } from "react";
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
import { getScan } from "../services/scanApi";
import "./ScanResultsPage.css";

const resultTabs = [
  "Summary",
  "Cookies",
  "Network",
  "Storage",
  "Source code",
  "Fix guidance",
];

function ScanResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const scanId = searchParams.get("scan");

  const [scan, setScan] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(scanId));
  const [loadError, setLoadError] = useState("");

  const [activeTab, setActiveTab] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isCookiesOpen, setIsCookiesOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [isSourceCodeOpen, setIsSourceCodeOpen] =
    useState(false);
  const [isFixGuidanceOpen, setIsFixGuidanceOpen] =
    useState(false);

  const isModalOpen =
    isSummaryOpen ||
    isCookiesOpen ||
    isNetworkOpen ||
    isStorageOpen ||
    isSourceCodeOpen ||
    isFixGuidanceOpen;

  useEffect(() => {
    if (!scanId) {
      setIsLoading(false);
      setLoadError("No scan ID was provided.");
      return;
    }

    let componentMounted = true;

    const loadScan = async () => {
      try {
        const data = await getScan(scanId);

        if (!componentMounted) {
          return;
        }

        setScan(data.scan);
        setLoadError("");
      } catch (error) {
        if (!componentMounted) {
          return;
        }

        setLoadError(
          error.message || "Unable to load the scan results.",
        );
      } finally {
        if (componentMounted) {
          setIsLoading(false);
        }
      }
    };

    loadScan();

    return () => {
      componentMounted = false;
    };
  }, [scanId]);

  const closeAllModals = () => {
    setIsSummaryOpen(false);
    setIsCookiesOpen(false);
    setIsNetworkOpen(false);
    setIsStorageOpen(false);
    setIsSourceCodeOpen(false);
    setIsFixGuidanceOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = isModalOpen ? "hidden" : "";

    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        closeAllModals();
      }
    };

    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener(
        "keydown",
        closeWithEscape,
      );
    };
  }, [isModalOpen]);

  const openSummary = () => {
    closeAllModals();
    setActiveTab("Summary");
    setIsSummaryOpen(true);
  };

  const openCookieFindings = () => {
    closeAllModals();
    setActiveTab("Cookies");
    setIsCookiesOpen(true);
  };

  const openNetworkFindings = () => {
    closeAllModals();
    setActiveTab("Network");
    setIsNetworkOpen(true);
  };

  const openStorageFindings = () => {
    closeAllModals();
    setActiveTab("Storage");
    setIsStorageOpen(true);
  };

  const openSourceCodeFindings = () => {
    closeAllModals();
    setActiveTab("Source code");
    setIsSourceCodeOpen(true);
  };

  const openFixGuidance = () => {
    closeAllModals();
    setActiveTab("Fix guidance");
    setIsFixGuidanceOpen(true);
  };

  const openTab = (tab) => {
    const tabActions = {
      Summary: openSummary,
      Cookies: openCookieFindings,
      Network: openNetworkFindings,
      Storage: openStorageFindings,
      "Source code": openSourceCodeFindings,
      "Fix guidance": openFixGuidance,
    };

    tabActions[tab]?.();
  };

  const summary = scan?.summary || {
    cookiesBeforeConsent: 0,
    cookiesAfterRejection: 0,
    thirdPartyRequestsBeforeConsent: 0,
    thirdPartyRequestsAfterRejection: 0,
    issuesDetected: 0,
  };

  const issuesDetected = summary.issuesDetected || 0;

  const overallStatus =
    scan?.status === "failed"
      ? "FAILED"
      : issuesDetected > 0
        ? "WARNING"
        : "PASSED";

  const highCount =
    summary.thirdPartyRequestsBeforeConsent || 0;

  const mediumCount =
    (summary.cookiesBeforeConsent || 0) +
    (summary.cookiesAfterRejection || 0);

  const lowCount =
    summary.thirdPartyRequestsAfterRejection || 0;

  const handleRunAgain = () => {
    navigate("/new-scan", {
      state: {
        targetUrl: scan?.targetUrl,
      },
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout
        activePage="New Scan"
        title="New Scan"
      >
        <section className="scan-results-page">
          <h1>Scan Results</h1>

          <article className="scan-results-card">
            <div className="scan-results-loading">
              <span className="scan-loading-ring" />
              <p>Loading scan results...</p>
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
          <h1>Scan Results</h1>

          <article className="scan-results-card">
            <div className="scan-results-error">
              <h2>Results unavailable</h2>
              <p>{loadError}</p>

              <button
                type="button"
                onClick={() => navigate("/scan-history")}
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
    <DashboardLayout activePage="New Scan" title="New Scan">
      <section className="scan-results-page">
        <h1>Scan Results</h1>

        <article className="scan-results-card">
          <h2>Scan Results</h2>

          <div className="scan-result-url">
            {scan?.targetUrl || "Unknown target"}
          </div>

          <div className="scan-overall-status">
            <span>Overall Status:</span>

            <strong
              className={`scan-status-${overallStatus.toLowerCase()}`}
            >
              {overallStatus}
            </strong>
          </div>

          <div className="scan-severity-summary">
            <span>High: {highCount}</span>
            <span>Medium: {mediumCount}</span>
            <span>Low: {lowCount}</span>
          </div>

          <div className="scan-result-actions">
            <button
              type="button"
              onClick={handleRunAgain}
            >
              Run again
            </button>

            <button
              type="button"
              onClick={() => {
                console.log(
                  "Export report for scan:",
                  scan?._id,
                );
              }}
            >
              Export Report
            </button>

            <button
              type="button"
              onClick={() => navigate("/new-scan")}
            >
              New Scan
            </button>
          </div>

          <section className="scan-tabs-section">
            <h3>Tabs:</h3>

            <div
              className="scan-result-tabs"
              role="tablist"
              aria-label="Scan result categories"
            >
              {resultTabs.map((tab) => (
                <button
                  className={
                    activeTab === tab
                      ? "scan-result-tab active"
                      : "scan-result-tab"
                  }
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  key={tab}
                  onClick={() => openTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </section>
        </article>
      </section>

      {isSummaryOpen && (
        <ScanSummaryModal
          scan={scan}
          onClose={closeAllModals}
          onViewCookies={openCookieFindings}
          onViewNetwork={openNetworkFindings}
          onViewSourceCode={openSourceCodeFindings}
        />
      )}

      {isCookiesOpen && (
        <CookieFindingsModal
          scan={scan}
          onClose={closeAllModals}
          onViewFinding={(finding) => {
            console.log(
              "Selected cookie finding:",
              finding,
            );
          }}
        />
      )}

      {isNetworkOpen && (
        <NetworkFindingsModal
          scan={scan}
          onClose={closeAllModals}
          onViewFinding={(finding) => {
            console.log(
              "Selected network finding:",
              finding,
            );
          }}
        />
      )}

      {isStorageOpen && (
        <BrowserStorageFindingsModal
          scan={scan}
          onClose={closeAllModals}
          onViewFinding={(finding) => {
            console.log(
              "Selected storage finding:",
              finding,
            );
          }}
        />
      )}

      {isSourceCodeOpen && (
        <SourceCodeFindingsModal
          scan={scan}
          onClose={closeAllModals}
          onViewFinding={(finding) => {
            console.log(
              "Selected source-code finding:",
              finding,
            );
          }}
        />
      )}

      {isFixGuidanceOpen && (
        <FixGuidanceModal
          scan={scan}
          onClose={closeAllModals}
          onRunAgain={handleRunAgain}
          onExportResults={() => {
            console.log(
              "Export results selected:",
              scan?._id,
            );
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default ScanResultsPage;