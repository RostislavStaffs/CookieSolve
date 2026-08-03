import User from "../models/User.js";
import {
  clearAuthCookie,
  createAuthToken,
  setAuthCookie,
} from "../utils/authToken.js";

function sanitiseUser(user) {
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
  };
}

export async function register(request, response) {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    } = request.body;

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !password ||
      !confirmPassword
    ) {
      return response.status(400).json({
        message: "Complete all registration fields.",
      });
    }

    if (password !== confirmPassword) {
      return response.status(400).json({
        message: "Passwords do not match.",
      });
    }

    if (password.length < 8) {
      return response.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }

    const normalisedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalisedEmail,
    });

    if (existingUser) {
      return response.status(409).json({
        message: "An account already exists with this email address.",
      });
    }

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalisedEmail,
      password,
    });

    const token = createAuthToken(user._id.toString());
    setAuthCookie(response, token);

    return response.status(201).json({
      message: "Account created successfully.",
      user: sanitiseUser(user),
    });
  } catch (error) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      const firstValidationError = Object.values(error.errors)[0];

      return response.status(400).json({
        message:
          firstValidationError?.message ||
          "The registration details are invalid.",
      });
    }

    if (error.code === 11000) {
      return response.status(409).json({
        message: "An account already exists with this email address.",
      });
    }

    return response.status(500).json({
      message: "Unable to create the account.",
    });
  }
}

export async function login(request, response) {
  try {
    const { email, password } = request.body;

    if (!email?.trim() || !password) {
      return response.status(400).json({
        message: "Enter your email address and password.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return response.status(401).json({
        message: "Incorrect email address or password.",
      });
    }

    const passwordMatches = await user.comparePassword(password);

    if (!passwordMatches) {
      return response.status(401).json({
        message: "Incorrect email address or password.",
      });
    }

    const token = createAuthToken(user._id.toString());
    setAuthCookie(response, token);

    return response.status(200).json({
      message: "Signed in successfully.",
      user: sanitiseUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return response.status(500).json({
      message: "Unable to sign in.",
    });
  }
}

export async function logout(request, response) {
  clearAuthCookie(response);

  return response.status(200).json({
    message: "Signed out successfully.",
  });
}

export async function getCurrentUser(request, response) {
  return response.status(200).json({
    user: sanitiseUser(request.user),
  });
}