import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import DashboardLayout from "../components/DashboardLayout";

import {
  getExportedReports,
  openExportedReport,
} from "../services/reportApi";

import "./ReportsPage.css";

function formatReportDate(
  value,
) {
  if (!value) {
    return "Unknown";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "2-digit",
    },
  );
}

function getReportStatusLabel(
  status,
) {
  if (status === "passed") {
    return "Passed";
  }

  if (status === "failed") {
    return "Failed";
  }

  return "Warning";
}

function getScanModeLabel(
  scanMode,
) {
  if (scanMode === "hybrid") {
    return "Hybrid";
  }

  if (
    scanMode === "source-code"
  ) {
    return "Source Code";
  }

  return "Runtime";
}

function ReportsPage() {
  const navigate =
    useNavigate();

  const [
    searchValue,
    setSearchValue,
  ] = useState("");

  const [
    reports,
    setReports,
  ] = useState([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    openingReportId,
    setOpeningReportId,
  ] = useState(null);

  useEffect(() => {
    let componentMounted =
      true;

    async function loadReports() {
      setIsLoading(true);
      setLoadError("");

      try {
        const data =
          await getExportedReports();

        if (!componentMounted) {
          return;
        }

        setReports(
          Array.isArray(
            data?.reports,
          )
            ? data.reports
            : [],
        );
      } catch (error) {
        if (!componentMounted) {
          return;
        }

        setLoadError(
          error.message ||
            "Unable to load exported reports.",
        );
      } finally {
        if (componentMounted) {
          setIsLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      componentMounted = false;
    };
  }, []);

  const filteredReports =
    useMemo(() => {
      const normalisedSearch =
        searchValue
          .trim()
          .toLowerCase();

      if (!normalisedSearch) {
        return reports;
      }

      return reports.filter(
        (report) => {
          const searchableValues = [
            report.name,
            report.target,
            formatReportDate(
              report.exportedAt,
            ),
            report.format,
            report.status,
            report.scanMode,
            String(
              report.findingCount ??
              0,
            ),
          ];

          return searchableValues.some(
            (value) =>
              String(value ?? "")
                .toLowerCase()
                .includes(
                  normalisedSearch,
                ),
          );
        },
      );
    }, [
      reports,
      searchValue,
    ]);

  async function handleOpenReport(
    report,
  ) {
    if (
      !report?._id ||
      openingReportId
    ) {
      return;
    }

    setOpeningReportId(
      report._id,
    );

    setLoadError("");

    try {
      await openExportedReport({
        reportId:
          report._id,
      });
    } catch (error) {
      setLoadError(
        error.message ||
          "The report could not be opened.",
      );
    } finally {
      setOpeningReportId(
        null,
      );
    }
  }

  return (
    <DashboardLayout
      activePage="Reports"
      title="Reports"
    >
      <section className="reports-page">
        <header className="reports-heading">
          <h1>
            Reports
          </h1>

          <p>
            View and reopen your exported scan reports.
          </p>
        </header>

        <section className="reports-panel">
          <div className="reports-content">
            <div className="reports-search-wrapper">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
              </svg>

              <input
                id="reports-search"
                type="search"
                value={searchValue}
                placeholder="Search reports"
                aria-label="Search exported reports"
                onChange={(event) =>
                  setSearchValue(
                    event.target.value,
                  )
                }
              />

              {searchValue && (
                <button
                  className="reports-clear-search"
                  type="button"
                  aria-label="Clear report search"
                  onClick={() =>
                    setSearchValue("")
                  }
                >
                  ×
                </button>
              )}
            </div>

            {loadError && (
              <div
                className="reports-error-message"
                role="alert"
              >
                <span>
                  {loadError}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    window.location.reload()
                  }
                >
                  Retry
                </button>
              </div>
            )}

            <div className="reports-table-wrapper">
              {isLoading ? (
                <div className="reports-loading-state">
                  <span className="reports-loading-ring" />

                  <p>
                    Loading exported reports...
                  </p>
                </div>
              ) : (
                <>
                  {filteredReports.length >
                  0 ? (
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th scope="col">
                            Report name
                          </th>

                          <th scope="col">
                            Target
                          </th>

                          <th scope="col">
                            Date
                          </th>

                          <th scope="col">
                            Mode
                          </th>

                          <th scope="col">
                            Format
                          </th>

                          <th scope="col">
                            Findings
                          </th>

                          <th scope="col">
                            Status
                          </th>

                          <th scope="col">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredReports.map(
                          (report) => {
                            const isOpening =
                              openingReportId ===
                              report._id;

                            const format =
                              String(
                                report.format ??
                                "",
                              ).toLowerCase();

                            const status =
                              String(
                                report.status ??
                                "warning",
                              ).toLowerCase();

                            return (
                              <tr
                                key={
                                  report._id
                                }
                              >
                                <td>
                                  <span className="report-name">
                                    {report.name}
                                  </span>
                                </td>

                                <td>
                                  <code
                                    title={
                                      report.target
                                    }
                                  >
                                    {report.target}
                                  </code>
                                </td>

                                <td>
                                  {formatReportDate(
                                    report.exportedAt,
                                  )}
                                </td>

                                <td>
                                  <span className="report-mode">
                                    {getScanModeLabel(
                                      report.scanMode,
                                    )}
                                  </span>
                                </td>

                                <td>
                                  <span
                                    className={`report-format ${format}`}
                                  >
                                    {format.toUpperCase()}
                                  </span>
                                </td>

                                <td>
                                  <span className="report-finding-count">
                                    {report.findingCount ??
                                      0}
                                  </span>
                                </td>

                                <td>
                                  <span
                                    className={`report-status ${status}`}
                                  >
                                    {getReportStatusLabel(
                                      status,
                                    )}
                                  </span>
                                </td>

                                <td>
                                  <button
                                    className="report-open-button"
                                    type="button"
                                    disabled={
                                      Boolean(
                                        openingReportId,
                                      )
                                    }
                                    onClick={() =>
                                      handleOpenReport(
                                        report,
                                      )
                                    }
                                  >
                                    {isOpening
                                      ? "Opening..."
                                      : "Open"}
                                  </button>
                                </td>
                              </tr>
                            );
                          },
                        )}
                      </tbody>
                    </table>
                  ) : (
                    <div className="reports-empty-state">
                      <div
                        className="reports-empty-icon"
                        aria-hidden="true"
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M7 3h7l4 4v14H7z" />
                          <path d="M14 3v5h5M10 13h5M10 17h5" />
                        </svg>
                      </div>

                      <h2>
                        {reports.length ===
                        0
                          ? "No reports exported yet"
                          : "No reports found"}
                      </h2>

                      <p>
                        {reports.length ===
                        0
                          ? "Export an HTML or JSON report from a completed scan and it will appear here."
                          : "Try searching by report name, target, date, format, mode, findings, or status."}
                      </p>

                      {reports.length ===
                        0 && (
                        <button
                          className="reports-empty-action"
                          type="button"
                          onClick={() =>
                            navigate(
                              "/scan-history",
                            )
                          }
                        >
                          View Scan History
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <footer className="reports-footer">
            <span>
              Showing{" "}
              {
                filteredReports.length
              }{" "}
              of{" "}
              {reports.length}{" "}
              reports
            </span>

            <button
              className="reports-new-scan-button"
              type="button"
              onClick={() =>
                navigate(
                  "/new-scan",
                )
              }
            >
              New Scan
            </button>
          </footer>
        </section>
      </section>
    </DashboardLayout>
  );
}

export default ReportsPage;