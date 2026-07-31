import { useEffect, useRef, useState } from "react";
import "./ScanProgressModal.css";

const scanSteps = [
  "Launching clean browser session",
  "Opening target website",
  "Capturing pre-consent cookies",
  "Capturing pre-consent network requests",
  "Clicking Reject All",
  "Capturing post-rejection behaviour",
  "Scanning source code",
  "Generating Report",
];

function getRandomDelay() {
  return Math.floor(Math.random() * 3000) + 2000;
}

function ScanProgressModal({
  targetUrl,
  onCancel,
  onComplete,
}) {
  const [completedSteps, setCompletedSteps] = useState(0);
  const timeoutRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const runNextStep = (stepIndex) => {
      if (cancelledRef.current) {
        return;
      }

      if (stepIndex >= scanSteps.length) {
        timeoutRef.current = window.setTimeout(() => {
          onComplete();
        }, 700);

        return;
      }

      timeoutRef.current = window.setTimeout(() => {
        if (cancelledRef.current) {
          return;
        }

        setCompletedSteps(stepIndex + 1);
        runNextStep(stepIndex + 1);
      }, getRandomDelay());
    };

    runNextStep(0);

    return () => {
      cancelledRef.current = true;
      window.clearTimeout(timeoutRef.current);
    };
  }, [onComplete]);

  const handleCancel = () => {
    cancelledRef.current = true;
    window.clearTimeout(timeoutRef.current);
    onCancel();
  };

  return (
    <div
      className="scan-modal-backdrop"
      role="presentation"
    >
      <section
        className="scan-progress-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-progress-title"
      >
        <h2 id="scan-progress-title">
          Running Privacy Scan
        </h2>

        <div className="scan-target-row">
          <span>Target:</span>

          <div className="scan-target-value">
            {targetUrl}
          </div>
        </div>

        <div className="scan-progress-section">
          <h3>Progress</h3>

          <ol className="scan-progress-list">
            {scanSteps.map((step, index) => {
              const isComplete = index < completedSteps;
              const isActive = index === completedSteps;

              return (
                <li
                  className={`scan-progress-item ${
                    isComplete ? "complete" : ""
                  } ${isActive ? "active" : ""}`}
                  key={step}
                >
                  <span
                    className="scan-step-status"
                    aria-hidden="true"
                  >
                    {isComplete && (
                      <svg viewBox="0 0 16 16">
                        <path d="m3 8.3 3 3L13 4.9" />
                      </svg>
                    )}

                    {isActive && (
                      <span className="scan-loading-ring" />
                    )}
                  </span>

                  <span>{step}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <button
          className="cancel-scan-button"
          type="button"
          onClick={handleCancel}
        >
          Cancel Scan
        </button>
      </section>
    </div>
  );
}

export default ScanProgressModal;