import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import "./DashboardPage.css";

const summaryCards = [
  {
    label: "Total Scans",
    value: "15",
  },
  {
    label: "Failed Scans",
    value: "6",
  },
  {
    label: "Passed",
    value: "7",
  },
  {
    label: "Warnings",
    value: "2",
  },
];

const recentScans = [
  {
    targetUrl: "localhost:3000",
    status: "Failed",
    issues: 5,
  },
  {
    targetUrl: "localhost:5173",
    status: "Passed",
    issues: 0,
  },
  {
    targetUrl: "stagingSite.com",
    status: "Warning",
    issues: 2,
  },
];

function DashboardPage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout activePage="Dashboard" title="Dashboard">
      <section className="dashboard-introduction">
        <h1>Welcome to CookieSolve</h1>

        <p>
          Test whether your website truly respects cookie rejection before it
          reaches users.
        </p>
      </section>

      <section className="dashboard-panel">
        <button
          className="dashboard-new-scan-button"
          type="button"
          onClick={() => navigate("/new-scan")}
        >
          New Scan
        </button>

        <section className="dashboard-section">
          <h2>Summary Cards</h2>

          <div className="dashboard-summary-grid">
            {summaryCards.map((card) => (
              <article className="dashboard-summary-card" key={card.label}>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-section recent-scans-section">
          <h2>Recent Scans</h2>

          <div className="recent-scans-table">
            <div className="recent-scans-column">
              <h3>Target URL</h3>

              {recentScans.map((scan) => (
                <p key={scan.targetUrl}>{scan.targetUrl}</p>
              ))}
            </div>

            <div className="recent-scans-column">
              <h3>Status</h3>

              {recentScans.map((scan) => (
                <p key={`${scan.targetUrl}-${scan.status}`}>{scan.status}</p>
              ))}
            </div>

            <div className="recent-scans-column">
              <h3>Issues</h3>

              {recentScans.map((scan) => (
                <p key={`${scan.targetUrl}-${scan.issues}`}>{scan.issues}</p>
              ))}
            </div>

            <div className="recent-scans-column">
              <h3>Actions</h3>

              {recentScans.map((scan) => (
                <button
                  type="button"
                  key={`${scan.targetUrl}-view`}
                  onClick={() => navigate("/scan-history")}
                >
                  View
                </button>
              ))}
            </div>
          </div>
        </section>

        <button
          className="dashboard-history-button"
          type="button"
          onClick={() => navigate("/scan-history")}
        >
          View All Scan History
        </button>
      </section>
    </DashboardLayout>
  );
}

export default DashboardPage;