import "./SourceCodeFindingsModal.css";

function formatSeverity(severity) {
  if (!severity) {
    return "Unknown";
  }

  return (
    severity.charAt(0).toUpperCase() +
    severity.slice(1)
  );
}

function SourceCodeFindingsModal({
  scan,
  findings = [],
  onClose,
  onViewFinding,
}) {
  const sourceCodeFindings =
    findings.filter(
      (finding) =>
        finding.category ===
        "source-code",
    );

  const sourceScanningSelected =
    scan?.scanOptions?.sourceCode ===
    true;

  const affectedFiles = new Set(
    sourceCodeFindings
      .map(
        (finding) =>
          finding.evidence?.file,
      )
      .filter(Boolean),
  ).size;

  return (
    <div
      className="source-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="source-findings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-findings-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="source-modal-header">
          <div>
            <h2 id="source-findings-title">
              Source Code Findings
            </h2>

            <p>
              Source locations where tracking behaviour may run without an appropriate consent check.
            </p>
          </div>

          <button
            className="source-modal-close"
            type="button"
            aria-label="Close source code findings"
            onClick={onClose}
          >
            <span />
            <span />
          </button>
        </header>

        <div className="source-table-wrapper">
          <table className="source-findings-table">
            <thead>
              <tr>
                <th scope="col">
                  File
                </th>

                <th scope="col">
                  Line
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
              {sourceCodeFindings.length >
              0 ? (
                sourceCodeFindings.map(
                  (finding, index) => {
                    const evidence =
                      finding.evidence ?? {};

                    return (
                      <tr
                        key={
                          finding._id ??
                          `${finding.type}-${index}`
                        }
                      >
                        <td>
                          <code>
                            {evidence.file ??
                              "Unknown file"}
                          </code>
                        </td>

                        <td>
                          <span className="source-line-number">
                            {evidence.line ??
                              "—"}
                          </span>
                        </td>

                        <td>
                          {finding.title}
                        </td>

                        <td>
                          <span
                            className={`source-severity-badge ${
                              finding.severity ===
                              "high"
                                ? "high"
                                : "medium"
                            }`}
                          >
                            {formatSeverity(
                              finding.severity,
                            )}
                          </span>
                        </td>

                        <td>
                          <button
                            className="source-view-button"
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
                    {sourceScanningSelected
                      ? "Source-code analysis has been selected, but the static analyser has not been implemented yet."
                      : "Source-code analysis was not enabled for this scan."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="source-modal-footer">
          <span>
            <strong>
              {sourceCodeFindings.length}
            </strong>{" "}
            source-code findings
          </span>

          <span>
            <strong>
              {affectedFiles}
            </strong>{" "}
            files affected
          </span>
        </div>
      </section>
    </div>
  );
}

export default SourceCodeFindingsModal;