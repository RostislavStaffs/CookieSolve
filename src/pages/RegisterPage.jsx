import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./RegisterPage.css";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(
        error.message || "Unable to create your account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="register-form" onSubmit={handleSubmit}>
      <div className="name-fields">
        <label className="visually-hidden" htmlFor="first-name">
          First name
        </label>

        <input
          id="first-name"
          name="firstName"
          type="text"
          value={form.firstName}
          placeholder="First name"
          autoComplete="given-name"
          required
          maxLength="50"
          onChange={updateField}
        />

        <label className="visually-hidden" htmlFor="last-name">
          Last name
        </label>

        <input
          id="last-name"
          name="lastName"
          type="text"
          value={form.lastName}
          placeholder="Last name"
          autoComplete="family-name"
          required
          maxLength="50"
          onChange={updateField}
        />
      </div>

      <label className="visually-hidden" htmlFor="register-email">
        Email address
      </label>

      <input
        id="register-email"
        name="email"
        type="email"
        value={form.email}
        placeholder="Email address"
        autoComplete="email"
        required
        onChange={updateField}
      />

      <label className="visually-hidden" htmlFor="register-password">
        Password
      </label>

      <input
        id="register-password"
        name="password"
        type="password"
        value={form.password}
        placeholder="Password"
        autoComplete="new-password"
        required
        minLength="8"
        onChange={updateField}
      />

      <label
        className="visually-hidden"
        htmlFor="register-confirm-password"
      >
        Confirm password
      </label>

      <input
        id="register-confirm-password"
        name="confirmPassword"
        type="password"
        value={form.confirmPassword}
        placeholder="Confirm Password"
        autoComplete="new-password"
        required
        minLength="8"
        onChange={updateField}
      />

      {errorMessage && (
        <p className="auth-form-message error" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        className="create-account-button"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}

export default RegisterPage;