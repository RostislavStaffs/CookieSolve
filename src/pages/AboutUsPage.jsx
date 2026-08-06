import { useNavigate } from "react-router-dom";

import PublicNavbar from "../components/PublicNavbar";

import "./AboutUsPage.css";

const principles = [
  {
    number: "01",
    title: "Developer focused",
    description:
      "CookieSolve is designed to help developers identify technical consent issues before a website reaches production.",
  },
  {
    number: "02",
    title: "Evidence based",
    description:
      "Scan results are supported by observable browser behaviour, source-code findings and clearly presented technical evidence.",
  },
  {
    number: "03",
    title: "Privacy by design",
    description:
      "Privacy checks should be part of the development process rather than something considered only after deployment.",
  },
];

const capabilities = [
  {
    title: "Runtime analysis",
    description:
      "Observe cookies, browser storage and network activity before consent and after a user makes a choice.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5h16v11H4z" />
        <path d="M8 20h8M12 16v4" />
        <path d="M8 9h3M8 12h6" />
      </svg>
    ),
  },
  {
    title: "Source-code scanning",
    description:
      "Highlight tracking scripts, storage writes and consent logic that may require closer developer review.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
      </svg>
    ),
  },
  {
    title: "Evidence correlation",
    description:
      "Connect observed browser behaviour with potentially related locations in the website’s source code.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="18" cy="7" r="2.5" />
        <circle cx="18" cy="17" r="2.5" />
        <path d="m8.4 11 7.1-3M8.4 13l7.1 3" />
      </svg>
    ),
  },
  {
    title: "Developer guidance",
    description:
      "Present findings with severity, technical evidence and practical guidance for investigating consent issues.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
    ),
  },
];

function AboutUsPage() {
  const navigate = useNavigate();

  return (
    <div className="about-page-shell">
      <PublicNavbar />

      <main className="about-page">
        <section className="about-hero">
          <div className="about-hero-glow about-hero-glow-left" />
          <div className="about-hero-glow about-hero-glow-right" />

          <div className="about-hero-content">
            <span className="about-eyebrow">
              About CookieSolve
            </span>

            <h1>
              Building privacy checks into the
              <span> development process.</span>
            </h1>

            <p>
              CookieSolve is a developer-oriented privacy analysis tool that
              helps identify cookies, tracking requests, browser-storage
              activity and source-code patterns that may not correctly respect
              a user’s consent decision.
            </p>

            <div className="about-hero-actions">
              <button
                className="about-primary-button"
                type="button"
                onClick={() => navigate("/sign-up")}
              >
                Get Started

                <svg viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M4 10h11M11 6l4 4-4 4" />
                </svg>
              </button>

              <button
                className="about-secondary-button"
                type="button"
                onClick={() => navigate("/sign-in")}
              >
                Sign In
              </button>
            </div>
          </div>

          <div className="about-hero-visual" aria-hidden="true">
            <div className="about-scan-window">
              <div className="about-window-header">
                <div className="about-window-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="about-window-address">
                  staging.website.dev
                </div>
              </div>

              <div className="about-window-body">
                <div className="about-window-sidebar">
                  <span className="active" />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="about-window-content">
                  <div className="about-visual-heading">
                    <div>
                      <span>Consent scan</span>
                      <strong>Technical findings</strong>
                    </div>

                    <span className="about-visual-status">
                      Warning
                    </span>
                  </div>

                  <div className="about-visual-summary">
                    <div>
                      <span>Cookies</span>
                      <strong>4</strong>
                    </div>

                    <div>
                      <span>Requests</span>
                      <strong>7</strong>
                    </div>

                    <div>
                      <span>Source issues</span>
                      <strong>3</strong>
                    </div>
                  </div>

                  <div className="about-visual-findings">
                    <div>
                      <span className="about-finding-icon high" />

                      <div>
                        <strong>
                          Tracker loaded before consent
                        </strong>

                        <span>
                          googletagmanager.com
                        </span>
                      </div>

                      <span className="about-finding-level high">
                        High
                      </span>
                    </div>

                    <div>
                      <span className="about-finding-icon medium" />

                      <div>
                        <strong>
                          Storage write requires review
                        </strong>

                        <span>
                          src/tracking.js · line 24
                        </span>
                      </div>

                      <span className="about-finding-level medium">
                        Medium
                      </span>
                    </div>

                    <div>
                      <span className="about-finding-icon low" />

                      <div>
                        <strong>
                          Possible source correlation
                        </strong>

                        <span>
                          Runtime and code evidence linked
                        </span>
                      </div>

                      <span className="about-finding-level low">
                        Review
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-floating-card about-floating-card-top">
              <div className="about-floating-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3 5 6v5c0 4.5 2.7 7.8 7 10 4.3-2.2 7-5.5 7-10V6z" />
                  <path d="m9 12 2 2 4-5" />
                </svg>
              </div>

              <div>
                <span>Consent state</span>
                <strong>Verified</strong>
              </div>
            </div>

            <div className="about-floating-card about-floating-card-bottom">
              <div className="about-floating-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M4 5h16v14H4z" />
                  <path d="m8 10-2 2 2 2M16 10l2 2-2 2M14 8l-4 8" />
                </svg>
              </div>

              <div>
                <span>Likely source</span>
                <strong>tracking.js:24</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="about-introduction">
          <div className="about-section-heading">
            <span>Why CookieSolve</span>

            <h2>
              A visual consent banner does not always mean the underlying
              website behaviour is compliant.
            </h2>
          </div>

          <div className="about-introduction-copy">
            <p>
              Websites can appear to offer meaningful cookie choices while
              still loading analytics, advertising or other non-essential
              technologies before the user has made a decision.
            </p>

            <p>
              CookieSolve helps developers inspect what happens technically,
              locate potentially related code and address issues earlier in the
              development lifecycle.
            </p>
          </div>
        </section>

        <section className="about-capabilities-section">
          <div className="about-section-heading centred">
            <span>What it does</span>

            <h2>
              One workflow for runtime and source-code evidence.
            </h2>

            <p>
              CookieSolve combines several forms of technical analysis to give
              developers a clearer view of consent implementation.
            </p>
          </div>

          <div className="about-capabilities-grid">
            {capabilities.map((capability) => (
              <article
                className="about-capability-card"
                key={capability.title}
              >
                <div className="about-capability-icon">
                  {capability.icon}
                </div>

                <h3>{capability.title}</h3>

                <p>{capability.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="about-mission-section">
          <div className="about-mission-card">
            <div className="about-mission-copy">
              <span className="about-eyebrow">
                Our purpose
              </span>

              <h2>
                Help developers find consent problems before users do.
              </h2>

              <p>
                Privacy implementation is often treated as a final compliance
                task. CookieSolve supports a more practical approach by making
                consent checks part of local and staging development.
              </p>

              <p>
                The platform does not replace legal review. It presents
                technical evidence, potential risks and developer guidance that
                can support further investigation.
              </p>
            </div>

            <div className="about-principles">
              {principles.map((principle) => (
                <article
                  className="about-principle"
                  key={principle.number}
                >
                  <span>{principle.number}</span>

                  <div>
                    <h3>{principle.title}</h3>
                    <p>{principle.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="about-workflow-section">
          <div className="about-section-heading centred">
            <span>How it works</span>

            <h2>
              From scan configuration to actionable evidence.
            </h2>
          </div>

          <div className="about-workflow">
            <article>
              <span>01</span>
              <h3>Configure</h3>
              <p>
                Select runtime, source-code or hybrid analysis and choose the
                evidence categories you want to inspect.
              </p>
            </article>

            <div className="about-workflow-line" />

            <article>
              <span>02</span>
              <h3>Analyse</h3>
              <p>
                CookieSolve captures browser behaviour and scans source files
                for patterns that may require review.
              </p>
            </article>

            <div className="about-workflow-line" />

            <article>
              <span>03</span>
              <h3>Investigate</h3>
              <p>
                Review findings, correlations, evidence snippets and practical
                guidance from one results screen.
              </p>
            </article>

            <div className="about-workflow-line" />

            <article>
              <span>04</span>
              <h3>Export</h3>
              <p>
                Generate professional HTML or structured JSON reports for
                documentation and further analysis.
              </p>
            </article>
          </div>
        </section>

        <section className="about-cta-section">
          <div className="about-cta-glow" />

          <div>
            <span className="about-eyebrow">
              Start analysing
            </span>

            <h2>
              Make consent testing part of every website release.
            </h2>

            <p>
              Identify hidden tracking behaviour and investigate the code behind
              it before your website goes live.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/sign-up")}
          >
            Create an account

            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M4 10h11M11 6l4 4-4 4" />
            </svg>
          </button>
        </section>

        <footer className="about-footer">
          <span>CookieSolve</span>

          <p>
            Developer-oriented technical privacy analysis.
          </p>

          <button
            type="button"
            onClick={() => navigate("/")}
          >
            Back to home
          </button>
        </footer>
      </main>
    </div>
  );
}

export default AboutUsPage;