import "./SourceCodeFindingsModal.css";

const sourceCodeFindings = [
  {
    id: 1,
    file: "src/App.jsx",
    line: 12,
    issue: "gtag called before consent",
    severity: "High",
  },
  {
    id: 2,
    file: "src/analytics.js",
    line: 5,
    issue: "document.cookie write",
    severity: "Medium",
  },
];

function SourceCodeFindingsModal({
  onClose,
  onViewFinding,
}) {
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
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="source-modal-header">
          <div>
            <h2 id="source-findings-title">
              Source Code Findings
            </h2>

            <p>
              Source locations where tracking behaviour may run without an
              appropriate consent check.
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
                <th scope="col">File</th>
                <th scope="col">Line</th>
                <th scope="col">Issue</th>
                <th scope="col">Severity</th>
                <th scope="col">Action</th>
              </tr>
            </thead>

            <tbody>
              {sourceCodeFindings.map((finding) => (
                <tr key={finding.id}>
                  <td>
                    <code>{finding.file}</code>
                  </td>

                  <td>
                    <span className="source-line-number">
                      {finding.line}
                    </span>
                  </td>

                  <td>{finding.issue}</td>

                  <td>
                    <span
                      className={`source-severity-badge ${finding.severity.toLowerCase()}`}
                    >
                      {finding.severity}
                    </span>
                  </td>

                  <td>
                    <button
                      className="source-view-button"
                      type="button"
                      onClick={() => onViewFinding?.(finding)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="source-modal-footer">
          <span>
            <strong>2</strong> source-code findings
          </span>

          <span>
            <strong>2</strong> files affected
          </span>
        </div>
      </section>
    </div>
  );
}

export default SourceCodeFindingsModal;