import {
  useMemo,
} from "react";

import "./CorrelationFindingsModal.css";

function getConfidenceClassName(
  confidence,
) {
  return String(
    confidence ?? "low",
  )
    .trim()
    .toLowerCase();
}

function CorrelationFindingsModal({
  correlations = [],
  findings = [],
  onClose,
  onViewFinding,
}) {
  const safeCorrelations =
    useMemo(
      () =>
        Array.isArray(
          correlations,
        )
          ? correlations
          : [],
      [correlations],
    );

  function openSourceFinding(
    correlation,
  ) {
    const sourceFinding =
      findings[
        correlation
          .sourceFindingIndex
      ];

    if (sourceFinding) {
      onViewFinding?.(
        sourceFinding,
      );
    }
  }

  return (
    <div
      className="correlation-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="correlation-findings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="correlation-findings-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="correlation-modal-header">
          <div>
            <span className="correlation-modal-eyebrow">
              Combined Analysis
            </span>

            <h2 id="correlation-findings-title">
              Runtime–Source Correlations
            </h2>

            <p>
              Potential links between observed browser behaviour and source-code patterns.
            </p>
          </div>

          <button
            className="correlation-modal-close"
            type="button"
            aria-label="Close correlations"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {safeCorrelations.length >
        0 ? (
          <div className="correlation-list">
            {safeCorrelations.map(
              (
                correlation,
                index,
              ) => (
                <article
                  className="correlation-card"
                  key={
                    correlation._id ||
                    `${correlation.runtimeFindingIndex}-${correlation.sourceFindingIndex}-${index}`
                  }
                >
                  <div className="correlation-card-heading">
                    <span
                      className={`correlation-confidence ${getConfidenceClassName(
                        correlation.confidence,
                      )}`}
                    >
                      {
                        correlation.confidence
                      }{" "}
                      confidence
                    </span>

                    <span className="correlation-score">
                      Score:{" "}
                      {
                        correlation.score
                      }
                    </span>
                  </div>

                  <div className="correlation-flow">
                    <div className="correlation-evidence-block">
                      <span>
                        Runtime evidence
                      </span>

                      <strong>
                        {
                          correlation.runtimeTitle
                        }
                      </strong>

                      <small>
                        {
                          correlation.runtimeFindingType
                        }
                      </small>
                    </div>

                    <div
                      className="correlation-arrow"
                      aria-hidden="true"
                    >
                      →
                    </div>

                    <div className="correlation-evidence-block">
                      <span>
                        Likely source
                      </span>

                      <strong>
                        {
                          correlation.sourceTitle
                        }
                      </strong>

                      <small>
                        {correlation.sourceFile ||
                          "Unknown file"}

                        {correlation.sourceLine
                          ? `, line ${correlation.sourceLine}`
                          : ""}
                      </small>
                    </div>
                  </div>

                  <p className="correlation-explanation">
                    {
                      correlation.explanation
                    }
                  </p>

                  {Array.isArray(
                    correlation.matchedIndicators,
                  ) &&
                    correlation
                      .matchedIndicators
                      .length > 0 && (
                      <div className="correlation-indicators">
                        {correlation.matchedIndicators.map(
                          (
                            indicator,
                            indicatorIndex,
                          ) => (
                            <span
                              key={`${indicator}-${indicatorIndex}`}
                            >
                              {
                                indicator
                              }
                            </span>
                          ),
                        )}
                      </div>
                    )}

                  <button
                    className="correlation-guidance-button"
                    type="button"
                    onClick={() =>
                      openSourceFinding(
                        correlation,
                      )
                    }
                  >
                    View likely source
                  </button>
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="correlation-empty-state">
            <h3>
              No correlations detected
            </h3>

            <p>
              Runtime and source findings were recorded, but no sufficiently strong shared indicators were identified.
            </p>
          </div>
        )}

        <footer className="correlation-modal-footer">
          <p>
            Correlations are heuristic links intended to help developers investigate likely causes. They do not prove that a specific source line caused the runtime behaviour.
          </p>

          <button
            type="button"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

export default CorrelationFindingsModal;