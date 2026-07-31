import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "./components/AuthLayout";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import NewScanPage from "./pages/NewScanPage";
import ScanResultsPage from "./pages/ScanResultsPage";
import ScanHistoryPage from "./pages/ScanHistoryPage";
import RulesAllowlistPage from "./pages/RulesAllowlistPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import HelpAboutPage from "./pages/HelpAboutPage";
import "./App.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route
          path="/sign-up"
          element={<RegisterPage />}
        />

        <Route
          path="/sign-in"
          element={<LoginPage />}
        />
      </Route>

      <Route
        path="/dashboard"
        element={<DashboardPage />}
      />

      <Route
        path="/new-scan"
        element={<NewScanPage />}
      />

      <Route
        path="/scan-results"
        element={<ScanResultsPage />}
      />

      <Route
        path="/scan-history"
        element={<ScanHistoryPage />}
      />

      <Route
        path="/rules"
        element={<RulesAllowlistPage />}
      />

      <Route
        path="/reports"
        element={<ReportsPage />}
      />

      <Route
        path="/settings"
        element={<SettingsPage />}
      />

      <Route
        path="/help"
        element={<HelpAboutPage />}
      />

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
      
    </Routes>
  );
}

export default App;