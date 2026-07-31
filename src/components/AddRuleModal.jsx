import { useEffect, useState } from "react";
import "./AddRuleModal.css";

function AddRuleModal({
  title,
  description,
  options,
  placeholder,
  onClose,
  onAdd,
}) {
  const [selectedOption, setSelectedOption] = useState("");
  const [customValue, setCustomValue] = useState("");

  useEffect(() => {
    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const value = customValue.trim() || selectedOption;

    if (!value) {
      return;
    }

    onAdd(value);
    onClose();
  };

  return (
    <div
      className="add-rule-modal-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="add-rule-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-rule-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="add-rule-modal-header">
          <div>
            <h2 id="add-rule-modal-title">{title}</h2>
            <p>{description}</p>
          </div>

          <button
            className="add-rule-modal-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            <span />
            <span />
          </button>
        </header>

        <form className="add-rule-modal-form" onSubmit={handleSubmit}>
          <fieldset className="rule-option-list">
            <legend>Choose an option</legend>

            {options.map((option) => (
              <label
                className={`rule-option-card ${
                  selectedOption === option.value ? "selected" : ""
                }`}
                key={option.value}
              >
                <input
                  type="radio"
                  name="ruleOption"
                  value={option.value}
                  checked={selectedOption === option.value}
                  onChange={() => {
                    setSelectedOption(option.value);
                    setCustomValue("");
                  }}
                />

                <span className="rule-option-radio" aria-hidden="true" />

                <span className="rule-option-content">
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="custom-rule-field">
            <label htmlFor="custom-rule-value">Or add a custom value</label>

            <input
              id="custom-rule-value"
              type="text"
              value={customValue}
              placeholder={placeholder}
              onChange={(event) => {
                setCustomValue(event.target.value);
                setSelectedOption("");
              }}
            />
          </div>

          <div className="add-rule-modal-actions">
            <button
              className="add-rule-cancel-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="add-rule-confirm-button"
              type="submit"
              disabled={!selectedOption && !customValue.trim()}
            >
              Add
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AddRuleModal;