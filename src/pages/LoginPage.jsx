import "./LoginPage.css";

function LoginPage() {
  return (
    <form className="login-form">
      <label className="visually-hidden" htmlFor="login-email">
        Email address
      </label>

      <input
        id="login-email"
        name="email"
        type="email"
        placeholder="Email address"
        autoComplete="email"
      />

      <label className="visually-hidden" htmlFor="login-password">
        Password
      </label>

      <input
        id="login-password"
        name="password"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
      />

      <button className="login-submit-button" type="button">
        Sign in
      </button>
    </form>
  );
}

export default LoginPage;