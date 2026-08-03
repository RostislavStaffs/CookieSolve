import "./ScanSummaryModal.css";

function getStatusColour(status) {
  if (status === "PASSED") {
    return "#67d99d";
  }

  if (status === "WARNING") {
    return "#f1bd6c";
  }

  return "#ff6677";
}

function ScanSummaryModal({
  findings = [],
  findingsSummary = {},
  overallStatus = "PASSED",
  onClose,
  onViewCookies,
  onViewNetwork,
  onViewSourceCode,
}) {
  const mainIssues = findings.slice(0, 5);

  return (
    <div
      className="summary-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="summary-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-modal-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="summary-modal-header">
          <h2 id="summary-modal-title">
            Summary
          </h2>

          <button
            className="summary-modal-close"
            type="button"
            aria-label="Close summary"
            onClick={onClose}
          >
            <span />
            <span />
          </button>
        </header>

        <div className="summary-status">
          <span>
            Overall Status:
          </span>

          <strong
            style={{
              color:
                getStatusColour(
                  overallStatus,
                ),
            }}
          >
            {overallStatus}
          </strong>
        </div>

        <section className="summary-issues">
          <h3>
            Main issues
          </h3>

          <ul>
            {mainIssues.length > 0 ? (
              mainIssues.map(
                (finding, index) => (
                  <li
                    key={
                      finding._id ??
                      `${finding.type}-${index}`
                    }
                  >
                    {finding.title}
                  </li>
                ),
              )
            ) : (
              <li>
                No potential consent-related issues were detected.
              </li>
            )}
          </ul>
        </section>

        <div className="summary-modal-actions">
          <button
            type="button"
            onClick={onViewCookies}
          >
            View cookie issues (
            {findingsSummary.cookies ?? 0})
          </button>

          <button
            type="button"
            onClick={onViewNetwork}
          >
            View network issues (
            {findingsSummary.network ?? 0})
          </button>

          <button
            type="button"
            onClick={onViewSourceCode}
          >
            View Source Code Issues
          </button>
        </div>
      </section>
    </div>
  );
}

export default ScanSummaryModal;