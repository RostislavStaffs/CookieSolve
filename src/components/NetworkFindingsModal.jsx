import "./NetworkFindingsModal.css";

const networkFindings = [
  {
    id: 1,
    url: "google-analytics.com/collect",
    timing: "After reject",
    severity: "High",
  },
  {
    id: 2,
    url: "facebook.com/tr",
    timing: "After reject",
    severity: "High",
  },
  {
    id: 3,
    url: "cdn.example.com/script.js",
    timing: "Before reject",
    severity: "Info",
  },
];

function NetworkFindingsModal({
  onClose,
  onViewFinding,
}) {
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
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="network-modal-header">
          <div>
            <h2 id="network-findings-title">
              Network Findings
            </h2>

            <p>
              Requests detected before consent or after the user rejected
              tracking.
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
                <th scope="col">URL</th>
                <th scope="col">Timing</th>
                <th scope="col">Severity</th>
                <th scope="col">Action</th>
              </tr>
            </thead>

            <tbody>
              {networkFindings.map((finding) => (
                <tr key={finding.id}>
                  <td>
                    <code>{finding.url}</code>
                  </td>

                  <td>{finding.timing}</td>

                  <td>
                    <span
                      className={`network-severity-badge ${finding.severity.toLowerCase()}`}
                    >
                      {finding.severity}
                    </span>
                  </td>

                  <td>
                    <button
                      className="network-view-button"
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

        <div className="network-modal-footer">
          <span>
            <strong>2</strong> high-severity requests
          </span>

          <span>
            <strong>1</strong> informational request
          </span>
        </div>
      </section>
    </div>
  );
}

export default NetworkFindingsModal;