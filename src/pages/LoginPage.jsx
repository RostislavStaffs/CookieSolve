import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

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

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login(form);

      const requestedPage = location.state?.from || "/dashboard";

      navigate(requestedPage, {
        replace: true,
      });
    } catch (error) {
      setErrorMessage(
        error.message || "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="visually-hidden" htmlFor="login-email">
        Email address
      </label>

      <input
        id="login-email"
        name="email"
        type="email"
        value={form.email}
        placeholder="Email address"
        autoComplete="email"
        required
        onChange={updateField}
      />

      <label className="visually-hidden" htmlFor="login-password">
        Password
      </label>

      <input
        id="login-password"
        name="password"
        type="password"
        value={form.password}
        placeholder="Password"
        autoComplete="current-password"
        required
        onChange={updateField}
      />

      {errorMessage && (
        <p className="auth-form-message error" role="alert">
          {errorMessage}
        </p>
      )}

      <button
        className="login-submit-button"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}

export default LoginPage;