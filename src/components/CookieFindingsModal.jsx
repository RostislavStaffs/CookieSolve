import "./CookieFindingsModal.css";

const cookieFindings = [
  {
    id: 1,
    name: "_ga",
    domain: "localhost",
    timing: "Before reject",
    severity: "High",
    action: "View",
  },
  {
    id: 2,
    name: "_fbp",
    domain: "localhost",
    timing: "After reject",
    severity: "High",
    action: "View",
  },
  {
    id: 3,
    name: "session_id",
    domain: "localhost",
    timing: "Before reject",
    severity: "Allowed",
    action: null,
  },
];

function CookieFindingsModal({ onClose, onViewFinding }) {
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
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="cookie-modal-header">
          <div>
            <h2 id="cookie-findings-title">Cookie Findings</h2>

            <p>
              Cookies detected before consent or after the user rejected
              tracking.
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
                <th scope="col">Cookie Name</th>
                <th scope="col">Domain</th>
                <th scope="col">Timing</th>
                <th scope="col">Severity</th>
                <th scope="col">Action</th>
              </tr>
            </thead>

            <tbody>
              {cookieFindings.map((finding) => (
                <tr key={finding.id}>
                  <td>
                    <code>{finding.name}</code>
                  </td>

                  <td>{finding.domain}</td>

                  <td>{finding.timing}</td>

                  <td>
                    <span
                      className={`cookie-severity-badge ${finding.severity.toLowerCase()}`}
                    >
                      {finding.severity}
                    </span>
                  </td>

                  <td>
                    {finding.action ? (
                      <button
                        className="cookie-view-button"
                        type="button"
                        onClick={() => onViewFinding?.(finding)}
                      >
                        View
                      </button>
                    ) : (
                      <span className="cookie-no-action">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cookie-modal-footer">
          <span>
            <strong>2</strong> potential issues
          </span>

          <span>
            <strong>1</strong> allowlisted cookie
          </span>
        </div>
      </section>
    </div>
  );
}

export default CookieFindingsModal;