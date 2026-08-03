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
import DeleteScanModal from "../components/DeleteScanModal";

import {
  deleteScan,
  getScans,
} from "../services/scanApi";

import "./ScanHistoryPage.css";

const statusOptions = [
  "All statuses",
  "Passed",
  "Warning",
  "Failed",
  "Running",
];

function formatScanDate(
  dateValue,
) {
  if (!dateValue) {
    return "Unknown date";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function getScanIssueCount(
  scan,
) {
  if (
    Number.isFinite(
      Number(
        scan?.findingsSummary?.total,
      ),
    )
  ) {
    return Number(
      scan.findingsSummary.total,
    );
  }

  if (
    Number.isFinite(
      Number(
        scan?.summary?.issuesDetected,
      ),
    )
  ) {
    return Number(
      scan.summary.issuesDetected,
    );
  }

  if (
    Array.isArray(
      scan?.findings,
    )
  ) {
    return scan.findings.length;
  }

  return 0;
}

function getScanStatus(scan) {
  if (scan?.status === "failed") {
    return "Failed";
  }

  if (
    scan?.status === "pending" ||
    scan?.status === "running"
  ) {
    return "Running";
  }

  const totalIssues =
    getScanIssueCount(scan);

  return totalIssues > 0
    ? "Warning"
    : "Passed";
}

function getStatusClassName(
  status,
) {
  return status
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      "-",
    );
}

function getTargetDisplayValue(
  targetUrl,
) {
  if (!targetUrl) {
    return "Unknown target";
  }

  try {
    const parsedUrl =
      new URL(targetUrl);

    return `${parsedUrl.hostname}${
      parsedUrl.port
        ? `:${parsedUrl.port}`
        : ""
    }`;
  } catch {
    return targetUrl;
  }
}

function ScanHistoryPage() {
  const navigate =
    useNavigate();

  const [scans, setScans] =
    useState([]);

  const [
    searchValue,
    setSearchValue,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState(
    "All statuses",
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    scanPendingDeletion,
    setScanPendingDeletion,
  ] = useState(null);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  const [
    deleteError,
    setDeleteError,
  ] = useState("");

  const loadScans =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setLoadError("");

        const data =
          await getScans();

        if (
          !Array.isArray(
            data?.scans,
          )
        ) {
          throw new Error(
            "The server did not return a valid scan list.",
          );
        }

        setScans(
          data.scans,
        );
      } catch (error) {
        console.error(
          "Unable to load scan history:",
          error,
        );

        setLoadError(
          error.message ||
            "Unable to load scan history.",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    loadScans();
  }, [loadScans]);

  useEffect(() => {
    const modalOpen =
      Boolean(
        scanPendingDeletion,
      );

    document.body.style.overflow =
      modalOpen
        ? "hidden"
        : "";

    function closeWithEscape(
      event,
    ) {
      if (
        event.key === "Escape" &&
        !isDeleting
      ) {
        setScanPendingDeletion(
          null,
        );

        setDeleteError("");
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
    isDeleting,
    scanPendingDeletion,
  ]);

  const filteredScans =
    useMemo(() => {
      const normalisedSearch =
        searchValue
          .trim()
          .toLowerCase();

      return scans.filter(
        (scan) => {
          const status =
            getScanStatus(
              scan,
            );

          const formattedDate =
            formatScanDate(
              scan.createdAt,
            );

          const searchableValues = [
            scan.targetUrl,
            getTargetDisplayValue(
              scan.targetUrl,
            ),
            formattedDate,
            scan.browser,
            status,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const matchesSearch =
            normalisedSearch.length ===
              0 ||
            searchableValues.includes(
              normalisedSearch,
            );

          const matchesStatus =
            statusFilter ===
              "All statuses" ||
            status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      scans,
      searchValue,
      statusFilter,
    ]);

  function handleViewScan(
    scanId,
  ) {
    navigate(
      `/scan-results?scan=${scanId}`,
    );
  }

  function handleRunAgain(
    scan,
  ) {
    navigate(
      "/new-scan",
      {
        state: {
          targetUrl:
            scan.targetUrl ?? "",

          rejectSelector:
            scan.rejectSelector ??
            "#reject-all",

          browser:
            scan.browser ??
            "chromium",

          waitTime:
            scan.waitTime ??
            3000,

          sourceFolder:
            scan.sourceCodeFolder ??
            "./src",

          necessaryCookieAllowlist:
            scan.necessaryCookieAllowlist ??
            [],

          scanOptions:
            scan.scanOptions ?? {
              cookies: true,
              networkRequests: true,
              browserStorage: true,
              sourceCode: false,
            },
        },
      },
    );
  }

  function openDeleteModal(
    scan,
  ) {
    setDeleteError("");

    setScanPendingDeletion(
      scan,
    );
  }

  function closeDeleteModal() {
    if (isDeleting) {
      return;
    }

    setScanPendingDeletion(
      null,
    );

    setDeleteError("");
  }

  async function confirmDeleteScan() {
    if (
      !scanPendingDeletion?._id ||
      isDeleting
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError("");

      const deletedScanId =
        scanPendingDeletion._id;

      await deleteScan(
        deletedScanId,
      );

      setScans(
        (currentScans) =>
          currentScans.filter(
            (scan) =>
              scan._id !==
              deletedScanId,
          ),
      );

      setScanPendingDeletion(
        null,
      );
    } catch (error) {
      console.error(
        "Unable to delete scan:",
        error,
      );

      setDeleteError(
        error.message ||
          "The scan could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  const showEmptyState =
    !isLoading &&
    !loadError &&
    filteredScans.length === 0;

  return (
    <DashboardLayout
      activePage="Scan History"
      title="Scan History"
    >
      <section className="scan-history-page">
        <header className="scan-history-heading">
          <h1>
            Scan History
          </h1>

          <p>
            Review and manage previous scans.
          </p>
        </header>

        <section className="scan-history-panel">
          <div className="scan-history-controls">
            <div className="history-control-row">
              <label htmlFor="scan-history-search">
                Search:
              </label>

              <div className="history-search-wrapper">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
                </svg>

                <input
                  id="scan-history-search"
                  type="search"
                  value={
                    searchValue
                  }
                  placeholder="Search target URL or date"
                  onChange={(event) =>
                    setSearchValue(
                      event.target
                        .value,
                    )
                  }
                />

                {searchValue && (
                  <button
                    className="clear-history-search"
                    type="button"
                    aria-label="Clear search"
                    onClick={() =>
                      setSearchValue(
                        "",
                      )
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="history-control-row">
              <label htmlFor="scan-history-filter">
                Filter:
              </label>

              <div className="history-select-wrapper">
                <select
                  id="scan-history-filter"
                  value={
                    statusFilter
                  }
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value,
                    )
                  }
                >
                  {statusOptions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ),
                  )}
                </select>

                <span
                  className="history-select-arrow"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          {isLoading && (
            <div className="scan-history-loading-state">
              <span className="scan-loading-ring" />

              <p>
                Loading scan history...
              </p>
            </div>
          )}

          {loadError && (
            <div
              className="scan-history-error-state"
              role="alert"
            >
              <h2>
                Scan history unavailable
              </h2>

              <p>
                {loadError}
              </p>

              <button
                type="button"
                onClick={
                  loadScans
                }
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading &&
            !loadError && (
              <div className="scan-history-table-wrapper">
                <table className="scan-history-table">
                  <thead>
                    <tr>
                      <th scope="col">
                        Date
                      </th>

                      <th scope="col">
                        Target URL
                      </th>

                      <th scope="col">
                        Status
                      </th>

                      <th scope="col">
                        Issues
                      </th>

                      <th scope="col">
                        Browser
                      </th>

                      <th scope="col">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredScans.map(
                      (scan) => {
                        const status =
                          getScanStatus(
                            scan,
                          );

                        const issueCount =
                          getScanIssueCount(
                            scan,
                          );

                        const cannotDelete =
                          status ===
                          "Running";

                        return (
                          <tr
                            key={
                              scan._id
                            }
                          >
                            <td>
                              {formatScanDate(
                                scan.createdAt,
                              )}
                            </td>

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
                              <span
                                className={`scan-history-status ${getStatusClassName(
                                  status,
                                )}`}
                              >
                                {status}
                              </span>
                            </td>

                            <td>
                              <span className="scan-history-issue-count">
                                {
                                  issueCount
                                }
                              </span>
                            </td>

                            <td>
                              <span className="scan-history-browser">
                                {scan.browser ??
                                  "Unknown"}
                              </span>
                            </td>

                            <td>
                              <div className="scan-history-actions">
                                <button
                                  className="scan-history-view-button"
                                  type="button"
                                  onClick={() =>
                                    handleViewScan(
                                      scan._id,
                                    )
                                  }
                                >
                                  View
                                </button>

                                <button
                                  className="scan-history-run-again-button"
                                  type="button"
                                  onClick={() =>
                                    handleRunAgain(
                                      scan,
                                    )
                                  }
                                >
                                  Run again
                                </button>

                                <button
                                  className="scan-history-delete-button"
                                  type="button"
                                  disabled={
                                    cannotDelete
                                  }
                                  title={
                                    cannotDelete
                                      ? "Running scans cannot be deleted"
                                      : "Delete scan"
                                  }
                                  onClick={() =>
                                    openDeleteModal(
                                      scan,
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>

                {showEmptyState && (
                  <div className="scan-history-empty-state">
                    <div
                      className="scan-history-empty-icon"
                      aria-hidden="true"
                    >
                      <svg viewBox="0 0 24 24">
                        <path d="M4 5.5h16M7 3v5M17 3v5M5 9h14v11H5z" />
                      </svg>
                    </div>

                    <h2>
                      No scans found
                    </h2>

                    <p>
                      {scans.length ===
                      0
                        ? "Run your first scan to see it here."
                        : "Try changing the search term or status filter."}
                    </p>
                  </div>
                )}
              </div>
            )}

          <footer className="scan-history-footer">
            <span>
              Showing{" "}
              {
                filteredScans.length
              }{" "}
              of {scans.length} scans
            </span>

            <button
              className="scan-history-new-scan-button"
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

      {scanPendingDeletion && (
        <DeleteScanModal
          scan={
            scanPendingDeletion
          }
          isDeleting={
            isDeleting
          }
          errorMessage={
            deleteError
          }
          onCancel={
            closeDeleteModal
          }
          onConfirm={
            confirmDeleteScan
          }
        />
      )}
    </DashboardLayout>
  );
}

export default ScanHistoryPage;