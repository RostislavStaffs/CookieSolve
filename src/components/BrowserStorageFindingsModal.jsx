import "./BrowserStorageFindingsModal.css";

const storageFindings = [
  {
    id: 1,
    type: "localStorage",
    key: "analytics_user",
    timing: "After reject",
    issue: "Tracking ID",
    severity: "High",
  },
  {
    id: 2,
    type: "sessionStorage",
    key: "banner_closed",
    timing: "After reject",
    issue: "Informational",
    severity: "Info",
  },
];

function BrowserStorageFindingsModal({
  onClose,
  onViewFinding,
}) {
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
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="storage-modal-header">
          <div>
            <h2 id="storage-findings-title">
              Browser Storage Findings
            </h2>

            <p>
              Local and session storage entries detected during the
              consent tests.
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
                <th scope="col">Type</th>
                <th scope="col">Key</th>
                <th scope="col">Timing</th>
                <th scope="col">Issue</th>
                <th scope="col">Severity</th>
                <th scope="col">Action</th>
              </tr>
            </thead>

            <tbody>
              {storageFindings.map((finding) => (
                <tr key={finding.id}>
                  <td>
                    <span className="storage-type-badge">
                      {finding.type}
                    </span>
                  </td>

                  <td>
                    <code>{finding.key}</code>
                  </td>

                  <td>{finding.timing}</td>

                  <td>{finding.issue}</td>

                  <td>
                    <span
                      className={`storage-severity-badge ${finding.severity.toLowerCase()}`}
                    >
                      {finding.severity}
                    </span>
                  </td>

                  <td>
                    <button
                      className="storage-view-button"
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

        <div className="storage-modal-footer">
          <span>
            <strong>1</strong> potential tracking entry
          </span>

          <span>
            <strong>1</strong> informational entry
          </span>
        </div>
      </section>
    </div>
  );
}

export default BrowserStorageFindingsModal;