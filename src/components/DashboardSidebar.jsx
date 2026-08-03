import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DashboardSidebar.css";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
  },
  {
    label: "New Scan",
    path: "/new-scan",
  },
  {
    label: "Scan History",
    path: "/scan-history",
  },
  {
    label: "Rules & Allowlist",
    path: "/rules",
  },
  {
    label: "Reports",
    path: "/reports",
  },
  {
    label: "Settings",
    path: "/settings",
  },
  {
    label: "Help & About",
    path: "/help",
  },
];

function DashboardSidebar({ activePage }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/sign-in", { replace: true });
    } catch (error) {
      console.error("Unable to sign out:", error);
    }
  };

  return (
    <aside className="dashboard-sidebar">
      <button
        className="dashboard-sidebar-logo"
        type="button"
        onClick={() => navigate("/dashboard")}
      >
        CookieSolve
      </button>

      <nav
        className="dashboard-sidebar-navigation"
        aria-label="Dashboard navigation"
      >
        {navigationItems.map((item) => (
          <button
            className={`dashboard-sidebar-link ${
              activePage === item.label ? "active" : ""
            }`}
            type="button"
            key={item.label}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="dashboard-sidebar-account">
        <div>
          <strong>
            {user?.firstName} {user?.lastName}
          </strong>

          <span>{user?.email}</span>
        </div>

        <button type="button" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}

export default DashboardSidebar;