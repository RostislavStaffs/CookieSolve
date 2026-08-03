import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getScan } from "../services/scanApi";
import "./ScanProgressModal.css";

const scanSteps = [
  {
    key: "launch",
    label: "Launching clean browser session",
    backendSteps: [
      "Waiting to start",
      "Starting runtime scan",
      "Launching browser",
    ],
  },
  {
    key: "open",
    label: "Opening target website",
    backendSteps: [
      "Loading target website",
    ],
  },
  {
    key: "pre-consent-wait",
    label: "Waiting for pre-consent activity",
    backendSteps: [
      "Waiting for pre-consent activity",
    ],
  },
  {
    key: "pre-consent-capture",
    label: "Capturing pre-consent behaviour",
    backendSteps: [
      "Capturing pre-consent evidence",
    ],
  },
  {
    key: "reject",
    label: "Clicking Reject All",
    backendSteps: [
      "Locating rejection control",
      "Rejecting consent",
    ],
  },
  {
    key: "post-rejection-wait",
    label: "Waiting for post-rejection activity",
    backendSteps: [
      "Waiting for post-rejection activity",
    ],
  },
  {
    key: "post-rejection-capture",
    label: "Capturing post-rejection behaviour",
    backendSteps: [
      "Capturing post-rejection evidence",
    ],
  },
  {
    key: "analysis",
    label: "Analysing captured evidence",
    backendSteps: [
      "Analysing captured evidence",
    ],
  },
  {
    key: "complete",
    label: "Saving scan results",
    backendSteps: [
      "Scan completed",
    ],
  },
];

function findCurrentStepIndex(currentStep, status) {
  if (status === "completed") {
    return scanSteps.length;
  }

  const matchingIndex = scanSteps.findIndex((step) =>
    step.backendSteps.includes(currentStep),
  );

  return matchingIndex >= 0
    ? matchingIndex
    : 0;
}

function ScanProgressModal({
  scanId,
  targetUrl,
  onCancel,
  onComplete,
}) {
  const [scan, setScan] = useState(null);
  const [errorMessage, setErrorMessage] =
    useState("");

  const pollingTimeoutRef = useRef(null);
  const completionTimeoutRef = useRef(null);
  const completionHandledRef = useRef(false);

  const currentStepIndex = useMemo(
    () =>
      findCurrentStepIndex(
        scan?.currentStep,
        scan?.status,
      ),
    [
      scan?.currentStep,
      scan?.status,
    ],
  );

  useEffect(() => {
    let componentMounted = true;

    function stopPolling() {
      if (pollingTimeoutRef.current) {
        window.clearTimeout(
          pollingTimeoutRef.current,
        );

        pollingTimeoutRef.current = null;
      }
    }

    async function loadScan() {
      try {
        const data = await getScan(scanId);

        if (!componentMounted) {
          return;
        }

        if (!data?.scan) {
          throw new Error(
            "The server did not return the scan record.",
          );
        }

        setScan(data.scan);
        setErrorMessage("");

        if (data.scan.status === "completed") {
          stopPolling();

          if (!completionHandledRef.current) {
            completionHandledRef.current = true;

            completionTimeoutRef.current =
              window.setTimeout(() => {
                if (componentMounted) {
                  onComplete(scanId);
                }
              }, 700);
          }

          return;
        }

        if (data.scan.status === "failed") {
          stopPolling();

          setErrorMessage(
            data.scan.errorMessage ||
              "The scan could not be completed.",
          );

          return;
        }

        pollingTimeoutRef.current =
          window.setTimeout(
            loadScan,
            1000,
          );
      } catch (error) {
        stopPolling();

        if (componentMounted) {
          setErrorMessage(
            error.message ||
              "Unable to retrieve the scan progress.",
          );
        }
      }
    }

    if (!scanId) {
      setErrorMessage(
        "No scan ID was provided.",
      );

      return undefined;
    }

    loadScan();

    return () => {
      componentMounted = false;

      stopPolling();

      if (completionTimeoutRef.current) {
        window.clearTimeout(
          completionTimeoutRef.current,
        );

        completionTimeoutRef.current = null;
      }
    };
  }, [
    scanId,
    onComplete,
  ]);

  function handleClose() {
    if (pollingTimeoutRef.current) {
      window.clearTimeout(
        pollingTimeoutRef.current,
      );

      pollingTimeoutRef.current = null;
    }

    onCancel();
  }

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
                ["pending", "running"].includes(
                  scan?.status,
                ) &&
                index === currentStepIndex;

              return (
                <li
                  className={[
                    "scan-progress-item",
                    isComplete
                      ? "complete"
                      : "",
                    isActive
                      ? "active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={step.key}
                >
                  <span
                    className="scan-step-status"
                    aria-hidden="true"
                  >
                    {isComplete && (
                      <svg
                        viewBox="0 0 16 16"
                        focusable="false"
                      >
                        <path d="m3 8.3 3 3L13 4.9" />
                      </svg>
                    )}

                    {isActive && (
                      <span className="scan-loading-ring" />
                    )}
                  </span>

                  <span>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        {!scan && !errorMessage && (
          <p
            className="scan-current-step"
            aria-live="polite"
          >
            Retrieving scan progress...
          </p>
        )}

        {scan &&
          ["pending", "running"].includes(
            scan.status,
          ) && (
            <p
              className="scan-current-step"
              aria-live="polite"
            >
              {scan.currentStep}
            </p>
          )}

        {scan?.status === "completed" && (
          <p
            className="scan-current-step"
            aria-live="polite"
          >
            Scan completed. Opening results...
          </p>
        )}

        {errorMessage && (
          <div
            className="scan-progress-error"
            role="alert"
          >
            <strong>
              Scan progress unavailable
            </strong>

            <span>
              {errorMessage}
            </span>
          </div>
        )}

        <button
          className="cancel-scan-button"
          type="button"
          onClick={handleClose}
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