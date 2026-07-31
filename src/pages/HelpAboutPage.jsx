import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import "./HelpAboutPage.css";

const toolFeatures = [
  {
    title: "Runtime consent testing",
    description:
      "Runs the website in a controlled browser session and checks what happens before consent and after rejection.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M7 6.5h.01M10 6.5h.01" />
      </svg>
    ),
  },
  {
    title: "Static source-code analysis",
    description:
      "Searches the selected source folder for tracking scripts, cookie writes and consent logic that may not be properly gated.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />
      </svg>
    ),
  },
  {
    title: "Technical evidence",
    description:
      "Records detected cookies, browser storage, network requests and related source-code locations.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5M10 12h5M10 16h5" />
      </svg>
    ),
  },
  {
    title: "Developer guidance",
    description:
      "Explains detected issues and provides practical suggestions that developers can use when improving their consent implementation.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M9 18h6M10 22h4" />
        <path d="M8.2 14.5A7 7 0 1 1 15.8 14.5C14.7 15.3 14 16 14 17h-4c0-1-.7-1.7-1.8-2.5Z" />
      </svg>
    ),
  },
];

const workflowSteps = [
  {
    number: "01",
    title: "Start the target website",
    description:
      "Run the website locally or make the staging environment available.",
  },
  {
    number: "02",
    title: "Configure a new scan",
    description:
      "Enter the URL, select the consent action and choose which checks to run.",
  },
  {
    number: "03",
    title: "Run the hybrid analysis",
    description:
      "CookieSolve combines runtime browser testing with static source-code inspection.",
  },
  {
    number: "04",
    title: "Review the findings",
    description:
      "Examine cookies, network requests, browser storage and source-code evidence.",
  },
  {
    number: "05",
    title: "Apply guidance and rescan",
    description:
      "Update the website implementation and run another scan to verify the changes.",
  },
];

function HelpAboutPage() {
  const navigate = useNavigate();

  return (
    <DashboardLayout activePage="Help & About" title="Help & About">
      <section className="help-about-page">
        <header className="help-about-heading">
          <h1>Help & About</h1>
          <p>Learn what CookieSolve does and how to use it.</p>
        </header>

        <section className="help-about-panel">
          <div className="help-about-content">
            <section className="help-overview">
              <div className="help-section-label">
                <span />
                About the tool
              </div>

              <h2>What does CookieSolve do?</h2>

              <p>
                CookieSolve is a developer-focused privacy testing tool for
                local and staging websites. It helps identify whether
                non-essential tracking remains active before consent or after a
                user rejects it.
              </p>

              <p>
                The tool uses a hybrid approach by combining browser-based
                runtime testing with static source-code analysis. Findings are
                presented as technical evidence rather than automatic legal
                conclusions.
              </p>
            </section>

            <section
              className="help-feature-grid"
              aria-label="CookieSolve features"
            >
              {toolFeatures.map((feature) => (
                <article className="help-feature-card" key={feature.title}>
                  <div className="help-feature-icon">{feature.icon}</div>

                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </article>
              ))}
            </section>

            <section className="help-workflow-section">
              <div className="help-section-label">
                <span />
                Getting started
              </div>

              <h2>How to use it</h2>

              <div className="help-workflow">
                {workflowSteps.map((step) => (
                  <article className="help-workflow-step" key={step.number}>
                    <span className="help-step-number">{step.number}</span>

                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="help-disclaimer">
              <div className="help-disclaimer-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>
              </div>

              <div>
                <h3>Important</h3>

                <p>
                  CookieSolve highlights potential technical consent issues. It
                  does not provide legal certification or replace professional
                  legal review.
                </p>
              </div>
            </aside>
          </div>

          <footer className="help-about-footer">
            <button
              className="help-start-scan-button"
              type="button"
              onClick={() => navigate("/new-scan")}
            >
              Start New Scan
            </button>
          </footer>
        </section>
      </section>
    </DashboardLayout>
  );
}

export default HelpAboutPage;