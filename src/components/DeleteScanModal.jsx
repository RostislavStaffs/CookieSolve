import "./DeleteScanModal.css";

function getTargetDisplayValue(
  targetUrl,
) {
  if (!targetUrl) {
    return "Unknown target";
  }

  try {
    const parsedUrl =
      new URL(targetUrl);

    return `${parsedUrl.hostname}${
      parsedUrl.port
        ? `:${parsedUrl.port}`
        : ""
    }`;
  } catch {
    return targetUrl;
  }
}

function DeleteScanModal({
  scan,
  isDeleting,
  errorMessage,
  onCancel,
  onConfirm,
}) {
  if (!scan) {
    return null;
  }

  return (
    <div
      className="delete-scan-backdrop"
      role="presentation"
      onMouseDown={() => {
        if (!isDeleting) {
          onCancel();
        }
      }}
    >
      <section
        className="delete-scan-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-scan-title"
        aria-describedby="delete-scan-description"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div
          className="delete-scan-icon"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24">
            <path d="M4 7h16" />
            <path d="M9 7V4h6v3" />
            <path d="m7 7 1 13h8l1-13" />
            <path d="M10 11v5M14 11v5" />
          </svg>
        </div>

        <h2 id="delete-scan-title">
          Delete scan?
        </h2>

        <p id="delete-scan-description">
          This will permanently remove the scan and all of its captured findings.
        </p>

        <div className="delete-scan-target">
          <span>
            Target
          </span>

          <code
            title={
              scan.targetUrl
            }
          >
            {getTargetDisplayValue(
              scan.targetUrl,
            )}
          </code>
        </div>

        {errorMessage && (
          <div
            className="delete-scan-error"
            role="alert"
          >
            {errorMessage}
          </div>
        )}

        <div className="delete-scan-actions">
          <button
            className="delete-scan-cancel"
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            className="delete-scan-confirm"
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting
              ? "Deleting..."
              : "Delete scan"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default DeleteScanModal;