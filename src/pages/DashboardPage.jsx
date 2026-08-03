import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";
import { getScans } from "../services/scanApi";

import "./DashboardPage.css";

function getIssueCount(scan) {
  const summaryTotal = Number(
    scan?.findingsSummary?.total,
  );

  if (Number.isFinite(summaryTotal)) {
    return summaryTotal;
  }

  if (Array.isArray(scan?.findings)) {
    return scan.findings.length;
  }

  const legacyTotal = Number(
    scan?.summary?.issuesDetected,
  );

  if (Number.isFinite(legacyTotal)) {
    return legacyTotal;
  }

  return 0;
}

function getDisplayStatus(scan) {
  if (scan?.status === "failed") {
    return "Failed";
  }

  if (
    scan?.status === "pending" ||
    scan?.status === "running"
  ) {
    return "Running";
  }

  if (getIssueCount(scan) > 0) {
    return "Warning";
  }

  return "Passed";
}

function getStatusClassName(status) {
  return status
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function getTargetDisplayValue(targetUrl) {
  if (!targetUrl) {
    return "Unknown target";
  }

  try {
    const parsedUrl = new URL(targetUrl);

    return `${parsedUrl.hostname}${
      parsedUrl.port
        ? `:${parsedUrl.port}`
        : ""
    }`;
  } catch {
    return targetUrl;
  }
}

function formatScanDate(dateValue) {
  if (!dateValue) {
    return "Unknown date";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

function DashboardPage() {
  const navigate = useNavigate();

  const [scans, setScans] = useState([]);
  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const loadDashboardData =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const data = await getScans();

        if (!Array.isArray(data?.scans)) {
          throw new Error(
            "The server did not return a valid scan list.",
          );
        }

        setScans(data.scans);
      } catch (error) {
        console.error(
          "Unable to load dashboard data:",
          error,
        );

        setLoadError(
          error.message ||
            "Unable to load dashboard data.",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const dashboardStatistics =
    useMemo(() => {
      return scans.reduce(
        (statistics, scan) => {
          const status =
            getDisplayStatus(scan);

          statistics.total += 1;

          if (status === "Failed") {
            statistics.failed += 1;
          }

          if (status === "Passed") {
            statistics.passed += 1;
          }

          if (status === "Warning") {
            statistics.warnings += 1;
          }

          if (status === "Running") {
            statistics.running += 1;
          }

          statistics.totalIssues +=
            getIssueCount(scan);

          return statistics;
        },
        {
          total: 0,
          failed: 0,
          passed: 0,
          warnings: 0,
          running: 0,
          totalIssues: 0,
        },
      );
    }, [scans]);

  const summaryCards = useMemo(
    () => [
      {
        label: "Total Scans",
        value: dashboardStatistics.total,
      },
      {
        label: "Failed Scans",
        value: dashboardStatistics.failed,
      },
      {
        label: "Passed",
        value: dashboardStatistics.passed,
      },
      {
        label: "Warnings",
        value: dashboardStatistics.warnings,
      },
    ],
    [dashboardStatistics],
  );

  /*
   * getScans() already returns the records
   * ordered newest first, but sorting here
   * keeps the Dashboard reliable if the API
   * response order changes later.
   */
  const recentScans = useMemo(() => {
    return [...scans]
      .sort((firstScan, secondScan) => {
        const firstDate = new Date(
          firstScan.createdAt ?? 0,
        ).getTime();

        const secondDate = new Date(
          secondScan.createdAt ?? 0,
        ).getTime();

        return secondDate - firstDate;
      })
      .slice(0, 3);
  }, [scans]);

  function handleViewScan(scanId) {
    navigate(
      `/scan-results?scan=${scanId}`,
    );
  }

  return (
    <DashboardLayout
      activePage="Dashboard"
      title="Dashboard"
    >
      <section className="dashboard-introduction">
        <h1>
          Welcome to CookieSolve
        </h1>

        <p>
          Test whether your website truly respects cookie rejection before it reaches users.
        </p>
      </section>

      <section className="dashboard-panel">
        <button
          className="dashboard-new-scan-button"
          type="button"
          onClick={() =>
            navigate("/new-scan")
          }
        >
          New Scan
        </button>

        {isLoading && (
          <div className="dashboard-loading-state">
            <span className="scan-loading-ring" />

            <p>
              Loading dashboard data...
            </p>
          </div>
        )}

        {loadError && (
          <div
            className="dashboard-error-state"
            role="alert"
          >
            <h2>
              Dashboard unavailable
            </h2>

            <p>{loadError}</p>

            <button
              type="button"
              onClick={loadDashboardData}
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !loadError && (
          <>
            <section className="dashboard-section">
              <h2>
                Scan Summary
              </h2>

              <div className="dashboard-summary-grid">
                {summaryCards.map(
                  (card) => (
                    <article
                      className="dashboard-summary-card"
                      key={card.label}
                    >
                      <p>{card.label}</p>

                      <strong>
                        {card.value}
                      </strong>
                    </article>
                  ),
                )}
              </div>

              {(dashboardStatistics.running >
                0 ||
                dashboardStatistics.totalIssues >
                  0) && (
                <div className="dashboard-secondary-summary">
                  {dashboardStatistics.running >
                    0 && (
                    <span>
                      <strong>
                        {
                          dashboardStatistics.running
                        }
                      </strong>{" "}
                      currently running
                    </span>
                  )}

                  <span>
                    <strong>
                      {
                        dashboardStatistics.totalIssues
                      }
                    </strong>{" "}
                    total findings detected
                  </span>
                </div>
              )}
            </section>

            <section className="dashboard-section recent-scans-section">
              <h2>
                Recent Scans
              </h2>

              {recentScans.length > 0 ? (
                <div className="dashboard-recent-table-wrapper">
                  <table className="dashboard-recent-table">
                    <thead>
                      <tr>
                        <th scope="col">
                          Target URL
                        </th>

                        <th scope="col">
                          Date
                        </th>

                        <th scope="col">
                          Status
                        </th>

                        <th scope="col">
                          Issues
                        </th>

                        <th scope="col">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentScans.map(
                        (scan) => {
                          const status =
                            getDisplayStatus(
                              scan,
                            );

                          return (
                            <tr key={scan._id}>
                              <td>
                                <code
                                  title={
                                    scan.targetUrl
                                  }
                                >
                                  {getTargetDisplayValue(
                                    scan.targetUrl,
                                  )}
                                </code>
                              </td>

                              <td>
                                {formatScanDate(
                                  scan.createdAt,
                                )}
                              </td>

                              <td>
                                <span
                                  className={`dashboard-scan-status ${getStatusClassName(
                                    status,
                                  )}`}
                                >
                                  {status}
                                </span>
                              </td>

                              <td>
                                <span className="dashboard-issue-count">
                                  {getIssueCount(
                                    scan,
                                  )}
                                </span>
                              </td>

                              <td>
                                <button
                                  className="dashboard-view-scan-button"
                                  type="button"
                                  onClick={() =>
                                    handleViewScan(
                                      scan._id,
                                    )
                                  }
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="dashboard-empty-state">
                  <div
                    className="dashboard-empty-icon"
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M4 5.5h16M7 3v5M17 3v5M5 9h14v11H5z" />
                    </svg>
                  </div>

                  <h3>
                    No scans yet
                  </h3>

                  <p>
                    Run your first scan to begin reviewing consent behaviour.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      navigate("/new-scan")
                    }
                  >
                    Start first scan
                  </button>
                </div>
              )}
            </section>

            <button
              className="dashboard-history-button"
              type="button"
              onClick={() =>
                navigate("/scan-history")
              }
            >
              View All Scan History
            </button>
          </>
        )}
      </section>
    </DashboardLayout>
  );
}

export default DashboardPage;