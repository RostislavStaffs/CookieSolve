import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import ScanSummaryModal from "../components/ScanSummaryModal";
import CookieFindingsModal from "../components/CookieFindingsModal";
import NetworkFindingsModal from "../components/NetworkFindingsModal";
import SourceCodeFindingsModal from "../components/SourceCodeFindingsModal";
import BrowserStorageFindingsModal from "../components/BrowserStorageFindingsModal";
import FixGuidanceModal from "../components/FixGuidanceModal";
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

  const [activeTab, setActiveTab] = useState(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isCookiesOpen, setIsCookiesOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isStorageOpen, setIsStorageOpen] = useState(false);
  const [isSourceCodeOpen, setIsSourceCodeOpen] = useState(false);
  const [isFixGuidanceOpen, setIsFixGuidanceOpen] = useState(false);

  const isModalOpen =
    isSummaryOpen ||
    isCookiesOpen ||
    isNetworkOpen ||
    isStorageOpen ||
    isSourceCodeOpen ||
    isFixGuidanceOpen;

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
      document.removeEventListener("keydown", closeWithEscape);
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

  return (
    <DashboardLayout activePage="New Scan" title="New Scan">
      <section className="scan-results-page">
        <h1>Scan Results</h1>

        <article className="scan-results-card">
          <h2>Scan Results</h2>

          <div className="scan-result-url">
            http://localhost:3000
          </div>

          <div className="scan-overall-status">
            <span>Overall Status:</span>
            <strong>FAILED</strong>
          </div>

          <div className="scan-severity-summary">
            <span>High: 2</span>
            <span>Medium: 2</span>
            <span>Low: 1</span>
          </div>

          <div className="scan-result-actions">
            <button
              type="button"
              onClick={() => navigate("/new-scan")}
            >
              Run again
            </button>

            <button type="button">
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
          onClose={closeAllModals}
          onViewCookies={openCookieFindings}
          onViewNetwork={openNetworkFindings}
          onViewSourceCode={openSourceCodeFindings}
        />
      )}

      {isCookiesOpen && (
        <CookieFindingsModal
          onClose={closeAllModals}
          onViewFinding={(finding) => {
            console.log("Selected cookie finding:", finding);
          }}
        />
      )}

      {isNetworkOpen && (
        <NetworkFindingsModal
          onClose={closeAllModals}
          onViewFinding={(finding) => {
            console.log("Selected network finding:", finding);
          }}
        />
      )}

      {isStorageOpen && (
        <BrowserStorageFindingsModal
          onClose={closeAllModals}
          onViewFinding={(finding) => {
            console.log("Selected storage finding:", finding);
          }}
        />
      )}

      {isSourceCodeOpen && (
        <SourceCodeFindingsModal
          onClose={closeAllModals}
          onViewFinding={(finding) => {
            console.log("Selected source-code finding:", finding);
          }}
        />
      )}

      {isFixGuidanceOpen && (
        <FixGuidanceModal
          onClose={closeAllModals}
          onRunAgain={() => navigate("/new-scan")}
          onExportResults={() => {
            console.log("Export results selected");
          }}
        />
      )}
    </DashboardLayout>
  );
}

export default ScanResultsPage;