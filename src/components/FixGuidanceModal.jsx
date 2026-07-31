import { useEffect, useRef, useState } from "react";
import "./FixGuidanceModal.css";

const exampleCode = `if (consent.analytics === true) {
  loadAnalytics();
}`;

function FixGuidanceModal({
  onClose,
  onRunAgain,
  onExportResults,
}) {
  const [isCopied, setIsCopied] = useState(false);
  const copiedTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(exampleCode);
      setIsCopied(true);

      window.clearTimeout(copiedTimerRef.current);

      copiedTimerRef.current = window.setTimeout(() => {
        setIsCopied(false);
      }, 1800);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <div
      className="fix-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="fix-guidance-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fix-guidance-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="fix-modal-header">
          <div>
            <h2 id="fix-guidance-title">Fix Guidance</h2>

            <p>
              Suggested changes based on the technical evidence detected during
              the scan.
            </p>
          </div>

          <button
            className="fix-modal-close"
            type="button"
            aria-label="Close fix guidance"
            onClick={onClose}
          >
            <span />
            <span />
          </button>
        </header>

        <section className="fix-guidance-content">
          <div className="fix-guidance-section">
            <h3>Issue</h3>
            <p>Analytics loads before consent.</p>
          </div>

          <div className="fix-guidance-section">
            <h3>Why this matters</h3>

            <p>
              Analytics and other non-essential tracking should remain disabled
              until the user has granted the relevant consent.
            </p>
          </div>

          <div className="fix-guidance-section">
            <h3>Suggested fix</h3>

            <p>
              Move analytics initialisation behind an explicit analytics-consent
              check. Ensure the same condition is checked again after page
              refreshes and navigation.
            </p>
          </div>

          <div className="fix-guidance-section code-example-section">
            <div className="code-example-heading">
              <h3>Example</h3>
              <span>JavaScript</span>
            </div>

            <div
              className="guidance-code-block"
              aria-label="Example JavaScript consent check"
            >
              <div className="code-toolbar">
                <button
                  className={`copy-code-button ${
                    isCopied ? "copied" : ""
                  }`}
                  type="button"
                  onClick={handleCopyCode}
                  aria-live="polite"
                >
                  {isCopied ? (
                    <>
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path d="m3 8.2 3 3L13 4.8" />
                      </svg>

                      Copied
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 20 20" aria-hidden="true">
                        <rect x="7" y="6" width="9" height="10" rx="2" />
                        <path d="M13 6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
                      </svg>

                      Copy code
                    </>
                  )}
                </button>
              </div>

              <div className="code-content">
                <div className="code-line-numbers" aria-hidden="true">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                </div>

                <pre>
                  <code>
                    <span className="code-keyword">if</span>
                    <span className="code-bracket"> (</span>
                    <span className="code-variable">consent</span>
                    <span className="code-operator">.</span>
                    <span className="code-property">analytics</span>
                    <span className="code-operator"> === </span>
                    <span className="code-boolean">true</span>
                    <span className="code-bracket">) {"{"}</span>
                    {"\n"}
                    {"  "}
                    <span className="code-function">loadAnalytics</span>
                    <span className="code-bracket">();</span>
                    {"\n"}
                    <span className="code-bracket">{"}"}</span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <div className="fix-modal-actions">
          <button type="button" onClick={onRunAgain}>
            Run again after fix
          </button>

          <button type="button" onClick={onExportResults}>
            Export Results
          </button>
        </div>
      </section>
    </div>
  );
}

export default FixGuidanceModal;