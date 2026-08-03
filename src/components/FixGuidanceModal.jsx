import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./FixGuidanceModal.css";

const guidanceByType = {
  "cookie-before-consent": {
    why:
      "Non-essential cookies should not be created until the user has granted the relevant consent.",
    fix:
      "Move the cookie creation and associated script initialisation behind an explicit consent check.",
    example: `if (consent.analytics === true) {
  createAnalyticsCookie();
  loadAnalytics();
}`,
  },

  "cookie-persisted-after-rejection": {
    why:
      "A non-essential cookie that remains after rejection may continue identifying or tracking the user.",
    fix:
      "Delete the cookie when consent is rejected and prevent the related script from loading again.",
    example: `function rejectAnalyticsConsent() {
  document.cookie =
    "analytics_cookie=; Max-Age=0; path=/";

  disableAnalytics();
}`,
  },

  "cookie-created-after-rejection": {
    why:
      "Creating a non-essential cookie after rejection contradicts the user's recorded consent choice.",
    fix:
      "Ensure rejection prevents all analytics or marketing initialisation paths from executing.",
    example: `if (consent.analytics !== true) {
  return;
}

createAnalyticsCookie();`,
  },

  "storage-before-consent": {
    why:
      "Browser-storage identifiers can be used for tracking in a similar way to cookies.",
    fix:
      "Create non-essential localStorage or sessionStorage entries only after the relevant consent has been granted.",
    example: `if (consent.analytics === true) {
  localStorage.setItem(
    "analytics_id",
    createAnalyticsId(),
  );
}`,
  },

  "storage-persisted-after-rejection": {
    why:
      "A tracking identifier that remains in browser storage may continue to identify the user after rejection.",
    fix:
      "Remove the stored identifier when consent is rejected and stop any code that recreates it.",
    example: `function rejectAnalyticsConsent() {
  localStorage.removeItem("analytics_id");
  sessionStorage.removeItem("analytics_session");
}`,
  },

  "storage-created-after-rejection": {
    why:
      "Creating a tracking-related storage value after rejection indicates that tracking logic continued to run.",
    fix:
      "Place the storage write behind a consent condition and exit immediately when consent is absent.",
    example: `if (consent.analytics !== true) {
  return;
}

sessionStorage.setItem(
  "analytics_session",
  sessionId,
);`,
  },

  "suspicious-request-before-consent": {
    why:
      "A potentially tracking-related network request was sent before the user made a consent decision.",
    fix:
      "Delay loading the script or sending the request until the relevant consent category has been accepted.",
    example: `if (consent.analytics === true) {
  fetch("/analytics/collect", {
    method: "POST",
  });
}`,
  },

  "suspicious-request-after-rejection": {
    why:
      "A potentially tracking-related request continued after the user rejected consent.",
    fix:
      "Prevent the request handler from running after rejection and disable any previously initialised tracking service.",
    example: `if (consent.analytics !== true) {
  disableAnalytics();
  return;
}

sendAnalyticsRequest();`,
  },
};

const defaultGuidance = {
  why:
    "This behaviour may indicate that non-essential processing is not fully controlled by the user's consent choice.",
  fix:
    "Review the related script and ensure it only runs when the required consent category has been explicitly accepted.",
  example: `if (consent.analytics === true) {
  loadAnalytics();
}`,
};

function FixGuidanceModal({
  finding,
  findings = [],
  onClose,
  onRunAgain,
  onExportResults,
}) {
  const [isCopied, setIsCopied] =
    useState(false);

  const copiedTimerRef =
    useRef(null);

  const activeFinding = useMemo(() => {
    if (finding) {
      return finding;
    }

    return (
      findings.find(
        (item) =>
          item.severity === "high",
      ) ??
      findings[0] ??
      null
    );
  }, [
    finding,
    findings,
  ]);

  const guidance = useMemo(() => {
    if (!activeFinding) {
      return {
        issue:
          "No runtime findings detected",
        why:
          "The completed scan did not produce a finding that requires remediation guidance.",
        fix:
          "No immediate technical change is suggested. Continue testing additional controlled scenarios.",
        example:
          "// No remediation example is required.",
      };
    }

    const matchedGuidance =
      guidanceByType[
        activeFinding.type
      ] ?? defaultGuidance;

    return {
      issue:
        activeFinding.title,
      why:
        matchedGuidance.why,
      fix:
        matchedGuidance.fix,
      example:
        matchedGuidance.example,
    };
  }, [activeFinding]);

  const lineNumbers =
    guidance.example
      .split("\n")
      .map((_, index) => index + 1);

  useEffect(() => {
    return () => {
      window.clearTimeout(
        copiedTimerRef.current,
      );
    };
  }, []);

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(
        guidance.example,
      );

      setIsCopied(true);

      window.clearTimeout(
        copiedTimerRef.current,
      );

      copiedTimerRef.current =
        window.setTimeout(() => {
          setIsCopied(false);
        }, 1800);
    } catch {
      setIsCopied(false);
    }
  }

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
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="fix-modal-header">
          <div>
            <h2 id="fix-guidance-title">
              Fix Guidance
            </h2>

            <p>
              Suggested changes based on the technical evidence detected during the scan.
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

            <p>
              {guidance.issue}
            </p>
          </div>

          {activeFinding?.description && (
            <div className="fix-guidance-section">
              <h3>
                Detected evidence
              </h3>

              <p>
                {
                  activeFinding.description
                }
              </p>
            </div>
          )}

          <div className="fix-guidance-section">
            <h3>
              Why this matters
            </h3>

            <p>
              {guidance.why}
            </p>
          </div>

          <div className="fix-guidance-section">
            <h3>
              Suggested fix
            </h3>

            <p>
              {guidance.fix}
            </p>
          </div>

          <div className="fix-guidance-section code-example-section">
            <div className="code-example-heading">
              <h3>Example</h3>

              <span>
                JavaScript
              </span>
            </div>

            <div
              className="guidance-code-block"
              aria-label="Example JavaScript consent fix"
            >
              <div className="code-toolbar">
                <button
                  className={`copy-code-button ${
                    isCopied
                      ? "copied"
                      : ""
                  }`}
                  type="button"
                  onClick={
                    handleCopyCode
                  }
                  aria-live="polite"
                >
                  {isCopied ? (
                    <>
                      <svg
                        viewBox="0 0 16 16"
                        aria-hidden="true"
                      >
                        <path d="m3 8.2 3 3L13 4.8" />
                      </svg>

                      Copied
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <rect
                          x="7"
                          y="6"
                          width="9"
                          height="10"
                          rx="2"
                        />

                        <path d="M13 6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
                      </svg>

                      Copy code
                    </>
                  )}
                </button>
              </div>

              <div className="code-content">
                <div
                  className="code-line-numbers"
                  aria-hidden="true"
                >
                  {lineNumbers.map(
                    (lineNumber) => (
                      <span
                        key={
                          lineNumber
                        }
                      >
                        {lineNumber}
                      </span>
                    ),
                  )}
                </div>

                <pre>
                  <code>
                    {guidance.example}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <div className="fix-modal-actions">
          <button
            type="button"
            onClick={onRunAgain}
          >
            Run again after fix
          </button>

          <button
            type="button"
            onClick={
              onExportResults
            }
          >
            Export Results
          </button>
        </div>
      </section>
    </div>
  );
}

export default FixGuidanceModal;