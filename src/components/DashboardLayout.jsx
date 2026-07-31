import DashboardSidebar from "./DashboardSidebar";
import "./DashboardLayout.css";

function DashboardLayout({ activePage, title, children }) {
  return (
    <div className="dashboard-layout">
      <DashboardSidebar activePage={activePage} />

      <div className="dashboard-layout-content">
        <header className="dashboard-topbar">
          <p>{title}</p>
        </header>

        <main className="dashboard-page-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;