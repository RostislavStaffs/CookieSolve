import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import "./ReportsPage.css";

const exportedReports = [
  {
    id: 1,
    name: "localhost-report",
    target: "localhost:3000",
    date: "9 Jul 26",
    format: "HTML",
    status: "Failed",
  },
  {
    id: 2,
    name: "staging-report",
    target: "staging.cookiesolve.dev",
    date: "8 Jul 26",
    format: "JSON",
    status: "Warning",
  },
  {
    id: 3,
    name: "checkout-consent-report",
    target: "checkout.staging.dev",
    date: "4 Jul 26",
    format: "HTML",
    status: "Failed",
  },
];

function ReportsPage() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");

  const filteredReports = useMemo(() => {
    const normalisedSearch = searchValue.trim().toLowerCase();

    if (!normalisedSearch) {
      return exportedReports;
    }

    return exportedReports.filter((report) => {
      return [
        report.name,
        report.target,
        report.date,
        report.format,
        report.status,
      ].some((value) =>
        value.toLowerCase().includes(normalisedSearch),
      );
    });
  }, [searchValue]);

  const handleOpenReport = (report) => {
    console.log("Open exported report:", report);
  };

  return (
    <DashboardLayout activePage="Reports" title="Reports">
      <section className="reports-page">
        <header className="reports-heading">
          <h1>Reports</h1>
          <p>View and manage exported reports.</p>
        </header>

        <section className="reports-panel">
          <div className="reports-content">
            <div className="reports-search-wrapper">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
              </svg>

              <input
                id="reports-search"
                type="search"
                value={searchValue}
                placeholder="Search reports"
                aria-label="Search exported reports"
                onChange={(event) =>
                  setSearchValue(event.target.value)
                }
              />

              {searchValue && (
                <button
                  className="reports-clear-search"
                  type="button"
                  aria-label="Clear report search"
                  onClick={() => setSearchValue("")}
                >
                  ×
                </button>
              )}
            </div>

            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th scope="col">Report name</th>
                    <th scope="col">Target</th>
                    <th scope="col">Date</th>
                    <th scope="col">Format</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReports.map((report) => (
                    <tr key={report.id}>
                      <td>
                        <span className="report-name">
                          {report.name}
                        </span>
                      </td>

                      <td>
                        <code>{report.target}</code>
                      </td>

                      <td>{report.date}</td>

                      <td>
                        <span
                          className={`report-format ${report.format.toLowerCase()}`}
                        >
                          {report.format}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`report-status ${report.status.toLowerCase()}`}
                        >
                          {report.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="report-open-button"
                          type="button"
                          onClick={() =>
                            handleOpenReport(report)
                          }
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredReports.length === 0 && (
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

                  <h2>No reports found</h2>

                  <p>
                    Try searching by report name, target, date,
                    format, or status.
                  </p>
                </div>
              )}
            </div>
          </div>

          <footer className="reports-footer">
            <span>
              Showing {filteredReports.length} of{" "}
              {exportedReports.length} reports
            </span>

            <button
              className="reports-new-scan-button"
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

export default ReportsPage;