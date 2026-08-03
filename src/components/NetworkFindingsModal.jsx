import "./NetworkFindingsModal.css";

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

function NetworkFindingsModal({
  findings = [],
  onClose,
  onViewFinding,
}) {
  const networkFindings = findings.filter(
    (finding) =>
      finding.category === "network",
  );

  const highCount =
    networkFindings.filter(
      (finding) =>
        finding.severity === "high",
    ).length;

  const otherCount =
    networkFindings.length -
    highCount;

  return (
    <div
      className="network-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="network-findings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="network-findings-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="network-modal-header">
          <div>
            <h2 id="network-findings-title">
              Network Findings
            </h2>

            <p>
              Potentially tracking-related requests detected before consent or after rejection.
            </p>
          </div>

          <button
            className="network-modal-close"
            type="button"
            aria-label="Close network findings"
            onClick={onClose}
          >
            <span />
            <span />
          </button>
        </header>

        <div className="network-table-wrapper">
          <table className="network-findings-table">
            <thead>
              <tr>
                <th scope="col">
                  URL
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
              {networkFindings.length >
              0 ? (
                networkFindings.map(
                  (finding, index) => {
                    const evidence =
                      finding.evidence ?? {};

                    return (
                      <tr
                        key={
                          finding._id ??
                          `${finding.type}-${evidence.url}-${index}`
                        }
                      >
                        <td>
                          <code
                            title={
                              evidence.url
                            }
                          >
                            {evidence.url ??
                              "Unknown request"}
                          </code>
                        </td>

                        <td>
                          {formatTiming(
                            finding.phase,
                          )}
                        </td>

                        <td>
                          <span
                            className={`network-severity-badge ${
                              finding.severity ===
                              "high"
                                ? "high"
                                : "info"
                            }`}
                          >
                            {formatSeverity(
                              finding.severity,
                            )}
                          </span>
                        </td>

                        <td>
                          <button
                            className="network-view-button"
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
                  <td colSpan="4">
                    No suspicious network requests were detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="network-modal-footer">
          <span>
            <strong>
              {highCount}
            </strong>{" "}
            high-severity requests
          </span>

          <span>
            <strong>
              {otherCount}
            </strong>{" "}
            medium or low-severity requests
          </span>
        </div>
      </section>
    </div>
  );
}

export default NetworkFindingsModal;