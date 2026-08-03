const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function sendAuthRequest(endpoint, options = {}) {
  const headers = {
    ...options.headers,
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}/auth${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await response.json().catch(() => ({
    message: "The server returned an invalid response.",
  }));

  if (!response.ok) {
    throw new Error(
      data.message || "Authentication request failed.",
    );
  }

  return data;
}

export function registerUser(details) {
  return sendAuthRequest("/register", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export function loginUser(details) {
  return sendAuthRequest("/login", {
    method: "POST",
    body: JSON.stringify(details),
  });
}

export function logoutUser() {
  return sendAuthRequest("/logout", {
    method: "POST",
  });
}

export function getCurrentUser() {
  return sendAuthRequest("/me", {
    method: "GET",
  });
}