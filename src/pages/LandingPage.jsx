import { useNavigate } from "react-router-dom";
import PublicNavbar from "../components/PublicNavbar";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <PublicNavbar />

      <main className="landing-main">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              <span>Build Websites That</span>
              <span>Respect Consent</span>
            </h1>

            <p className="hero-description">
              Uncover hidden tracking and consent issues before your website goes
              live.
            </p>

            <button
              className="outline-button get-started-button"
              type="button"
              onClick={() => navigate("/sign-up")}
            >
              Get Started
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;