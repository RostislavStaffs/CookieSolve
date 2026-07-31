import "./ScanSummaryModal.css";

function ScanSummaryModal({
  onClose,
  onViewCookies,
  onViewNetwork,
  onViewSourceCode,
}) {
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
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="summary-modal-header">
          <h2 id="summary-modal-title">Summary</h2>

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
          <span>Overall Status:</span>
          <strong>FAILED</strong>
        </div>

        <section className="summary-issues">
          <h3>Main issues</h3>

          <ul>
            <li>_ga cookie created before consent</li>
            <li>Analytics request sent after Reject All</li>
            <li>analytics.js imported before consent check</li>
          </ul>
        </section>

        <div className="summary-modal-actions">
          <button type="button" onClick={onViewCookies}>
            View cookie issues
          </button>

          <button type="button" onClick={onViewNetwork}>
            View network issues
          </button>

          <button type="button" onClick={onViewSourceCode}>
            View Source Code Issues
          </button>
        </div>
      </section>
    </div>
  );
}

export default ScanSummaryModal;