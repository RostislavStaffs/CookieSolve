import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import connectDatabase from "./config/database.js";
import authRouter from "./routes/authRoutes.js";
import scanRouter from "./routes/scanRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const requiredEnvironmentVariables = [
  "MONGODB_URI",
  "JWT_SECRET",
  "CLIENT_URL",
];

const missingEnvironmentVariables =
  requiredEnvironmentVariables.filter(
    (variableName) => !process.env[variableName],
  );

if (missingEnvironmentVariables.length > 0) {
  console.error(
    `Missing environment variables: ${missingEnvironmentVariables.join(
      ", ",
    )}`,
  );

  process.exit(1);
}

app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (request, response) => {
  response.status(200).json({
    status: "ok",
    message: "CookieSolve API is running.",
  });
});

app.use("/api/auth", authRouter);
app.use("/api/scans", scanRouter);

app.use((request, response) => {
  response.status(404).json({
    message: "API route not found.",
    method: request.method,
    path: request.originalUrl,
  });
});

app.use((error, request, response, next) => {
  console.error("Unhandled server error:", error);

  response.status(500).json({
    message: "An unexpected server error occurred.",
  });
});

async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(
        `CookieSolve API running on http://localhost:${PORT}`,
      );

      console.log("Authentication API: /api/auth");
      console.log("Scan API: /api/scans");
    });
  } catch (error) {
    console.error("Unable to start CookieSolve API:", error);
    process.exit(1);
  }
}

startServer();