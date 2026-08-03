import "./BrowserStorageFindingsModal.css";

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

function BrowserStorageFindingsModal({
  findings = [],
  onClose,
  onViewFinding,
}) {
  const storageFindings =
    findings.filter(
      (finding) =>
        finding.category ===
        "browser-storage",
    );

  const highCount =
    storageFindings.filter(
      (finding) =>
        finding.severity === "high",
    ).length;

  const otherCount =
    storageFindings.length -
    highCount;

  return (
    <div
      className="storage-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="storage-findings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="storage-findings-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="storage-modal-header">
          <div>
            <h2 id="storage-findings-title">
              Browser Storage Findings
            </h2>

            <p>
              Local and session storage entries detected during the consent tests.
            </p>
          </div>

          <button
            className="storage-modal-close"
            type="button"
            aria-label="Close browser storage findings"
            onClick={onClose}
          >
            <span />
            <span />
          </button>
        </header>

        <div className="storage-table-wrapper">
          <table className="storage-findings-table">
            <thead>
              <tr>
                <th scope="col">
                  Type
                </th>

                <th scope="col">
                  Key
                </th>

                <th scope="col">
                  Timing
                </th>

                <th scope="col">
                  Issue
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
              {storageFindings.length >
              0 ? (
                storageFindings.map(
                  (finding, index) => {
                    const evidence =
                      finding.evidence ?? {};

                    return (
                      <tr
                        key={
                          finding._id ??
                          `${finding.type}-${evidence.key}-${index}`
                        }
                      >
                        <td>
                          <span className="storage-type-badge">
                            {evidence.storageType ??
                              "Storage"}
                          </span>
                        </td>

                        <td>
                          <code
                            title={
                              evidence.key
                            }
                          >
                            {evidence.key ??
                              "Unknown key"}
                          </code>
                        </td>

                        <td>
                          {formatTiming(
                            finding.phase,
                          )}
                        </td>

                        <td>
                          {finding.title}
                        </td>

                        <td>
                          <span
                            className={`storage-severity-badge ${
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
                            className="storage-view-button"
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
                  <td colSpan="6">
                    No browser-storage findings were detected.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="storage-modal-footer">
          <span>
            <strong>
              {highCount}
            </strong>{" "}
            high-severity entries
          </span>

          <span>
            <strong>
              {otherCount}
            </strong>{" "}
            medium or low-severity entries
          </span>
        </div>
      </section>
    </div>
  );
}

export default BrowserStorageFindingsModal;