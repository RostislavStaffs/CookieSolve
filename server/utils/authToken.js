import jwt from "jsonwebtoken";

export function createAuthToken(userId) {
  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
}

export function setAuthCookie(response, token) {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookie("cookiesolve_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(response) {
  const isProduction = process.env.NODE_ENV === "production";

  response.clearCookie("cookiesolve_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}