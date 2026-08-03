import "./CookieFindingsModal.css";

function formatTiming(phase) {
  if (phase === "pre-consent") {
    return "Before consent";
  }

  if (phase === "post-rejection") {
    return "After rejection";
  }

  return phase || "Unknown";
}

function formatSeverity(severity) {
  if (!severity) {
    return "Unknown";
  }

  return (
    severity.charAt(0).toUpperCase() +
    severity.slice(1)
  );
}

function CookieFindingsModal({
  scan,
  findings = [],
  onClose,
  onViewFinding,
}) {
  const cookieFindings = findings.filter(
    (finding) =>
      finding.category === "cookie",
  );

  const allowlistedCount =
    scan?.necessaryCookieAllowlist?.length ??
    0;

  return (
    <div
      className="cookie-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="cookie-findings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-findings-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="cookie-modal-header">
          <div>
            <h2 id="cookie-findings-title">
              Cookie Findings
            </h2>

            <p>
              Cookies detected before consent or after the user rejected tracking.
            </p>
          </div>

          <button
            className="cookie-modal-close"
            type="button"
            aria-label="Close cookie findings"
            onClick={onClose}
          >
            <span />
            <span />
          </button>
        </header>

        <div className="cookie-table-wrapper">
          <table className="cookie-findings-table">
            <thead>
              <tr>
                <th scope="col">
                  Cookie Name
                </th>

                <th scope="col">
                  Domain
                </th>

                <th scope="col">
                  Timing
                </th>

                <th scope="col">
                  Severity
                </th>

                <th scope="col">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {cookieFindings.length >
              0 ? (
                cookieFindings.map(
                  (finding, index) => {
                    const evidence =
                      finding.evidence ?? {};

                    return (
                      <tr
                        key={
                          finding._id ??
                          `${finding.type}-${evidence.name}-${index}`
                        }
                      >
                        <td>
                          <code>
                            {evidence.name ??
                              "Unknown cookie"}
                          </code>
                        </td>

                        <td>
                          {evidence.domain ??
                            "Unknown"}
                        </td>

                        <td>
                          {formatTiming(
                            finding.phase,
                          )}
                        </td>

                        <td>
                          <span
                            className={`cookie-severity-badge ${
                              finding.severity ===
                              "high"
                                ? "high"
                                : "allowed"
                            }`}
                          >
                            {formatSeverity(
                              finding.severity,
                            )}
                          </span>
                        </td>

                        <td>
                          <button
                            className="cookie-view-button"
                            type="button"
                            onClick={() =>
                              onViewFinding?.(
                                finding,
                              )
                            }
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  },
                )
              ) : (
                <tr>
                  <td colSpan="5">
                    No cookie findings were detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="cookie-modal-footer">
          <span>
            <strong>
              {cookieFindings.length}
            </strong>{" "}
            potential issues
          </span>

          <span>
            <strong>
              {allowlistedCount}
            </strong>{" "}
            allowlisted cookies
          </span>
        </div>
      </section>
    </div>
  );
}

export default CookieFindingsModal;