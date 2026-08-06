import {
  useEffect,
  useState,
} from "react";

import {
  downloadScanReport,
} from "../services/reportApi";

import "./ExportReportModal.css";

const reportFormats = [
  {
    value: "html",
    title: "HTML Report",
    description:
      "A readable developer report that can be opened in any modern browser.",
    extension: ".html",
  },

  {
    value: "json",
    title: "JSON Report",
    description:
      "Structured scan evidence suitable for storage, analysis or integration.",
    extension: ".json",
  },
];

function ExportReportModal({
  scan,
  onClose,
}) {
  const [
    selectedFormat,
    setSelectedFormat,
  ] = useState("html");

  const [
    isDownloading,
    setIsDownloading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const scanId =
    scan?._id ??
    scan?.id;

  useEffect(() => {
    function closeWithEscape(
      event,
    ) {
      if (
        event.key === "Escape" &&
        !isDownloading
      ) {
        onClose?.();
      }
    }

    document.addEventListener(
      "keydown",
      closeWithEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        closeWithEscape,
      );
    };
  }, [
    isDownloading,
    onClose,
  ]);

  async function handleDownload() {
    if (!scanId) {
      setErrorMessage(
        "This scan does not have a valid ID.",
      );

      return;
    }

    setErrorMessage("");
    setIsDownloading(true);

    try {
      await downloadScanReport({
        scanId,
        format:
          selectedFormat,
      });

      onClose?.();
    } catch (error) {
      setErrorMessage(
        error.message ||
          "The report could not be downloaded.",
      );
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div
      className="export-report-backdrop"
      role="presentation"
      onMouseDown={() => {
        if (!isDownloading) {
          onClose?.();
        }
      }}
    >
      <section
        className="export-report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-report-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="export-report-header">
          <div>
            <span className="export-report-eyebrow">
              Report Export
            </span>

            <h2 id="export-report-title">
              Export Scan Report
            </h2>

            <p>
              Choose the report format you want to download.
            </p>
          </div>

          <button
            className="export-report-close"
            type="button"
            aria-label="Close report export"
            disabled={
              isDownloading
            }
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="export-report-scan">
          <span>
            Scan
          </span>

          <strong>
            {scan?.scanMode ===
            "source-code"
              ? scan
                  ?.sourceCodeFolder ||
                "Source-code scan"
              : scan?.targetUrl ||
                "Unknown target"}
          </strong>
        </div>

        <fieldset className="export-format-options">
          <legend className="sr-only">
            Select report format
          </legend>

          {reportFormats.map(
            (format) => {
              const isSelected =
                selectedFormat ===
                format.value;

              return (
                <label
                  className={[
                    "export-format-card",
                    isSelected
                      ? "selected"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={
                    format.value
                  }
                >
                  <input
                    type="radio"
                    name="reportFormat"
                    value={
                      format.value
                    }
                    checked={
                      isSelected
                    }
                    disabled={
                      isDownloading
                    }
                    onChange={(
                      event,
                    ) => {
                      setSelectedFormat(
                        event.target
                          .value,
                      );

                      setErrorMessage(
                        "",
                      );
                    }}
                  />

                  <span className="export-format-icon">
                    {format.value ===
                    "html"
                      ? "</>"
                      : "{}"}
                  </span>

                  <span className="export-format-copy">
                    <strong>
                      {
                        format.title
                      }
                    </strong>

                    <small>
                      {
                        format.description
                      }
                    </small>
                  </span>

                  <span className="export-format-extension">
                    {
                      format.extension
                    }
                  </span>

                  <span
                    className="export-format-radio"
                    aria-hidden="true"
                  />
                </label>
              );
            },
          )}
        </fieldset>

        {errorMessage && (
          <p
            className="export-report-error"
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <footer className="export-report-footer">
          <p>
            The exported report contains technical evidence and does not independently establish legal non-compliance.
          </p>

          <div>
            <button
              className="export-report-cancel"
              type="button"
              disabled={
                isDownloading
              }
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="export-report-download"
              type="button"
              disabled={
                isDownloading
              }
              onClick={
                handleDownload
              }
            >
              {isDownloading
                ? "Preparing..."
                : `Download ${selectedFormat.toUpperCase()}`}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export default ExportReportModal;