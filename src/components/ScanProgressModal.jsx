import { useEffect, useMemo, useRef, useState } from "react";
import { getScan } from "../services/scanApi";
import "./ScanProgressModal.css";

const scanSteps = [
  {
    key: "launch",
    label: "Launching clean browser session",
    backendSteps: [
      "Preparing scan",
      "Launching browser",
    ],
  },
  {
    key: "open",
    label: "Opening target website",
    backendSteps: ["Loading target website"],
  },
  {
    key: "pre-consent",
    label: "Capturing pre-consent behaviour",
    backendSteps: ["Capturing pre-consent behaviour"],
  },
  {
    key: "reject",
    label: "Clicking Reject All",
    backendSteps: ["Applying reject action"],
  },
  {
    key: "wait",
    label: "Waiting for post-rejection activity",
    backendSteps: [
      "Waiting for post-rejection activity",
    ],
  },
  {
    key: "post-rejection",
    label: "Capturing post-rejection behaviour",
    backendSteps: [
      "Capturing post-rejection behaviour",
    ],
  },
  {
    key: "complete",
    label: "Saving scan results",
    backendSteps: ["Scan completed"],
  },
];

function findCurrentStepIndex(currentStep, status) {
  if (status === "completed") {
    return scanSteps.length;
  }

  const matchingIndex = scanSteps.findIndex((step) =>
    step.backendSteps.includes(currentStep),
  );

  return matchingIndex >= 0 ? matchingIndex : 0;
}

function ScanProgressModal({
  scanId,
  targetUrl,
  onCancel,
  onComplete,
}) {
  const [scan, setScan] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const intervalRef = useRef(null);
  const completionHandledRef = useRef(false);

  const currentStepIndex = useMemo(
    () =>
      findCurrentStepIndex(
        scan?.currentStep,
        scan?.status,
      ),
    [scan],
  );

  useEffect(() => {
    let componentMounted = true;

    const stopPolling = () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const loadScan = async () => {
      try {
        const data = await getScan(scanId);

        if (!componentMounted) {
          return;
        }

        setScan(data.scan);
        setErrorMessage("");

        if (data.scan.status === "completed") {
          stopPolling();

          if (!completionHandledRef.current) {
            completionHandledRef.current = true;

            window.setTimeout(() => {
              onComplete(scanId);
            }, 700);
          }
        }

        if (data.scan.status === "failed") {
          stopPolling();

          setErrorMessage(
            data.scan.errorMessage ||
              "The scan could not be completed.",
          );
        }
      } catch (error) {
        stopPolling();

        if (componentMounted) {
          setErrorMessage(
            error.message ||
              "Unable to retrieve the scan progress.",
          );
        }
      }
    };

    loadScan();

    intervalRef.current = window.setInterval(
      loadScan,
      1000,
    );

    return () => {
      componentMounted = false;
      stopPolling();
    };
  }, [scanId, onComplete]);

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
              const isComplete =
                scan?.status === "completed" ||
                index < currentStepIndex;

              const isActive =
                scan?.status === "running" &&
                index === currentStepIndex;

              return (
                <li
                  className={`scan-progress-item ${
                    isComplete ? "complete" : ""
                  } ${isActive ? "active" : ""}`}
                  key={step.key}
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

                  <span>{step.label}</span>
                </li>
              );
            })}
          </ol>
        </div>

        {scan?.status === "running" && (
          <p className="scan-current-step" aria-live="polite">
            {scan.currentStep}
          </p>
        )}

        {errorMessage && (
          <div className="scan-progress-error" role="alert">
            <strong>Scan failed</strong>
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          className="cancel-scan-button"
          type="button"
          onClick={onCancel}
        >
          {scan?.status === "failed"
            ? "Close"
            : "Close Progress"}
        </button>
      </section>
    </div>
  );
}

export default ScanProgressModal;