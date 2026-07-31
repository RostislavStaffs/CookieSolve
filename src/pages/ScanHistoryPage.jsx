import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import "./ScanHistoryPage.css";

const previousScans = [
  {
    id: 1,
    date: "8 Jul 26",
    targetUrl: "localhost:3000",
    status: "Failed",
    issues: 12,
  },
  {
    id: 2,
    date: "9 Jul 26",
    targetUrl: "localhost:5173",
    status: "Passed",
    issues: 5,
  },
  {
    id: 3,
    date: "11 Jul 26",
    targetUrl: "staging.cookiesolve.dev",
    status: "Warning",
    issues: 2,
  },
  {
    id: 4,
    date: "14 Jul 26",
    targetUrl: "localhost:4173",
    status: "Passed",
    issues: 0,
  },
];

function ScanHistoryPage() {
  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");

  const filteredScans = useMemo(() => {
    const normalisedSearch = searchValue.trim().toLowerCase();

    return previousScans.filter((scan) => {
      const matchesSearch =
        normalisedSearch.length === 0 ||
        scan.targetUrl.toLowerCase().includes(normalisedSearch) ||
        scan.date.toLowerCase().includes(normalisedSearch);

      const matchesStatus =
        statusFilter === "All statuses" ||
        scan.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchValue, statusFilter]);

  return (
    <DashboardLayout activePage="Scan History" title="Scan History">
      <section className="scan-history-page">
        <header className="scan-history-heading">
          <h1>Scan History</h1>

          <p>Review and manage previous scans.</p>
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
                  value={searchValue}
                  placeholder="Search target URL or date"
                  onChange={(event) =>
                    setSearchValue(event.target.value)
                  }
                />

                {searchValue && (
                  <button
                    className="clear-history-search"
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearchValue("")}
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
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                >
                  <option>All statuses</option>
                  <option>Passed</option>
                  <option>Failed</option>
                  <option>Warning</option>
                </select>

                <span
                  className="history-select-arrow"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="scan-history-table-wrapper">
            <table className="scan-history-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Target URL</th>
                  <th scope="col">Status</th>
                  <th scope="col">Issues</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredScans.map((scan) => (
                  <tr key={scan.id}>
                    <td>{scan.date}</td>

                    <td>
                      <code>{scan.targetUrl}</code>
                    </td>

                    <td>
                      <span
                        className={`scan-history-status ${scan.status.toLowerCase()}`}
                      >
                        {scan.status}
                      </span>
                    </td>

                    <td>
                      <span className="scan-history-issue-count">
                        {scan.issues}
                      </span>
                    </td>

                    <td>
                      <button
                        className="scan-history-view-button"
                        type="button"
                        onClick={() =>
                          navigate(`/scan-results?scan=${scan.id}`)
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredScans.length === 0 && (
              <div className="scan-history-empty-state">
                <div
                  className="scan-history-empty-icon"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24">
                    <path d="M4 5.5h16M7 3v5M17 3v5M5 9h14v11H5z" />
                  </svg>
                </div>

                <h2>No scans found</h2>

                <p>
                  Try changing the search term or status filter.
                </p>
              </div>
            )}
          </div>

          <footer className="scan-history-footer">
            <span>
              Showing {filteredScans.length} of{" "}
              {previousScans.length} scans
            </span>

            <button
              className="scan-history-new-scan-button"
              type="button"
              onClick={() => navigate("/new-scan")}
            >
              New Scan
            </button>
          </footer>
        </section>
      </section>
    </DashboardLayout>
  );
}

export default ScanHistoryPage;