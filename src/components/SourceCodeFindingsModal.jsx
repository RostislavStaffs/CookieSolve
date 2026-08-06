import {
  useMemo,
} from "react";

import "./SourceCodeFindingsModal.css";

function getSeverityClassName(
  severity,
) {
  return String(
    severity ?? "low",
  )
    .trim()
    .toLowerCase();
}

function getRuleName(finding) {
  return (
    finding?.evidence?.ruleId ||
    finding?.type ||
    "SOURCE_CODE_FINDING"
  );
}

function getFilePath(finding) {
  return (
    finding?.evidence?.file ||
    "Unknown file"
  );
}

function getLineNumber(finding) {
  const lineNumber =
    finding?.evidence?.line;

  return Number.isFinite(
    Number(lineNumber),
  )
    ? Number(lineNumber)
    : "—";
}

function SourceCodeFindingsModal({
  scan,
  findings = [],
  onClose,
  onViewFinding,
}) {
  const sourceCodeFindings =
    useMemo(() => {
      if (!Array.isArray(findings)) {
        return [];
      }

      return findings.filter(
        (finding) =>
          finding?.category ===
          "source-code",
      );
    }, [findings]);

  const affectedFiles =
    useMemo(() => {
      const files = new Set(
        sourceCodeFindings
          .map((finding) =>
            getFilePath(finding),
          )
          .filter(
            (file) =>
              file !==
              "Unknown file",
          ),
      );

      return files.size;
    }, [sourceCodeFindings]);

  return (
    <div
      className="source-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="source-findings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="source-findings-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="source-modal-header">
          <div>
            <span className="source-modal-eyebrow">
              Static Analysis
            </span>

            <h2 id="source-findings-title">
              Source Code Findings
            </h2>

            <p>
              Potential consent and tracking issues detected in{" "}
              <strong>
                {scan?.sourceCodeFolder ||
                  "the selected source folder"}
              </strong>
              .
            </p>
          </div>

          <button
            className="source-modal-close"
            type="button"
            aria-label="Close source code findings"
            onClick={onClose}
          >
            <span />
            <span />
          </button>
        </header>

        {sourceCodeFindings.length >
        0 ? (
          <div className="source-table-wrapper">
            <table className="source-findings-table">
              <thead>
                <tr>
                  <th scope="col">
                    Rule
                  </th>

                  <th scope="col">
                    File
                  </th>

                  <th scope="col">
                    Line
                  </th>

                  <th scope="col">
                    Issue
                  </th>

                  <th scope="col">
                    Severity
                  </th>

                  <th scope="col">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {sourceCodeFindings.map(
                  (
                    finding,
                    index,
                  ) => {
                    const ruleName =
                      getRuleName(
                        finding,
                      );

                    const filePath =
                      getFilePath(
                        finding,
                      );

                    const lineNumber =
                      getLineNumber(
                        finding,
                      );

                    return (
                      <tr
                        key={
                          finding?._id ||
                          `${ruleName}-${filePath}-${lineNumber}-${index}`
                        }
                      >
                        <td>
                          <code
                            className="source-rule-code"
                            title={ruleName}
                          >
                            {ruleName}
                          </code>
                        </td>

                        <td>
                          <code
                            className="source-file-code"
                            title={filePath}
                          >
                            {filePath}
                          </code>
                        </td>

                        <td>
                          <span className="source-line-number">
                            {lineNumber}
                          </span>
                        </td>

                        <td>
                          <div className="source-issue-cell">
                            <strong>
                              {finding?.title ||
                                "Potential source-code issue"}
                            </strong>

                            <small>
                              {finding?.description ||
                                "Review this source-code pattern."}
                            </small>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`source-severity-badge ${getSeverityClassName(
                              finding?.severity,
                            )}`}
                          >
                            {finding?.severity ||
                              "low"}
                          </span>
                        </td>

                        <td>
                          <button
                            className="source-view-button"
                            type="button"
                            onClick={() =>
                              onViewFinding?.(
                                finding,
                              )
                            }
                          >
                            View guidance
                          </button>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="source-empty-state">
            <div
              className="source-empty-icon"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24">
                <path d="M8 9 5 12l3 3M16 9l3 3-3 3M14 6l-4 12" />
              </svg>
            </div>

            <h3>
              No source-code findings
            </h3>

            <p>
              The enabled static-analysis rules did not detect any potential issues for this scan.
            </p>
          </div>
        )}

        <div className="source-modal-footer">
          <div>
            <span>
              <strong>
                {
                  sourceCodeFindings.length
                }
              </strong>{" "}
              source-code findings
            </span>

            <span>
              <strong>
                {affectedFiles}
              </strong>{" "}
              files affected
            </span>
          </div>

          <button
            className="source-modal-done-button"
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <p className="source-modal-disclaimer">
          Static analysis identifies patterns that may require developer review. A finding does not independently establish legal non-compliance.
        </p>
      </section>
    </div>
  );
}

export default SourceCodeFindingsModal;