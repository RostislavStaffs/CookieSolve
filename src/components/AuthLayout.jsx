import { Outlet, useLocation } from "react-router-dom";
import PublicNavbar from "./PublicNavbar";
import AuthSwitch from "./AuthSwitch";
import authIllustration from "../assets/signup-illustration.png";
import "./AuthLayout.css";

function AuthLayout() {
  const location = useLocation();
  const isSignInPage = location.pathname === "/sign-in";

  return (
    <div className="auth-page">
      <PublicNavbar />

      <main className="auth-main">
        <section className="auth-card">
          <aside className="auth-visual">
            <img
              className="auth-illustration"
              src={authIllustration}
              alt=""
            />

            <div className="auth-visual-content">
              <h1>
                Privacy Testing Made
                <span>Developer-Friendly</span>
              </h1>

              <p>
                Scan local and staging websites for tracking behaviour that
                continues after consent is rejected.
              </p>
            </div>
          </aside>

          <section className="auth-form-section">
            <div className="auth-form-wrapper">
              <div
                className="auth-heading-transition"
                key={`heading-${location.pathname}`}
              >
                <h2>
                  {isSignInPage ? "Sign in" : "Create Your Account"}
                </h2>
              </div>

              <AuthSwitch
                activePage={isSignInPage ? "signin" : "signup"}
              />

              <div
                className="auth-page-content"
                key={`form-${location.pathname}`}
              >
                <Outlet />
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

export default AuthLayout;