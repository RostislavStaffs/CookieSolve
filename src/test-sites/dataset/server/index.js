import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDirectory = path.resolve(__dirname, "..");

const siteApp = express();
const trackerApp = express();

siteApp.use(express.static(rootDirectory));

trackerApp.use(cors());
trackerApp.use(express.json());

trackerApp.get("/analytics/collect", (request, response) => {
  response.status(204).end();
});

trackerApp.get("/marketing/pixel", (request, response) => {
  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
    "base64",
  );

  response
    .status(200)
    .set("Content-Type", "image/gif")
    .send(pixel);
});

trackerApp.post("/events", (request, response) => {
  response.status(202).json({ received: true });
});

siteApp.listen(3100, () => {
  console.log("Controlled websites available at http://localhost:3100");
});

trackerApp.listen(3200, "0.0.0.0", () => {
  console.log("Mock third-party services available at http://127.0.0.1:3200");
});