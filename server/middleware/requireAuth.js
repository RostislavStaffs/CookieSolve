import jwt from "jsonwebtoken";
import User from "../models/User.js";

async function requireAuth(request, response, next) {
  try {
    const token = request.cookies.cookiesolve_token;

    if (!token) {
      return response.status(401).json({
        message: "Authentication is required.",
      });
    }

    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET,
    );

    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return response.status(401).json({
        message: "The authenticated user no longer exists.",
      });
    }

    request.user = user;

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return response.status(401).json({
        message: "Your session has expired. Sign in again.",
      });
    }

    console.error("Authentication middleware error:", error);

    return response.status(500).json({
      message: "Unable to verify authentication.",
    });
  }
}

export default requireAuth;