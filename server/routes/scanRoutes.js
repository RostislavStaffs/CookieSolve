import express from "express";
import {
  createScan,
  getScan,
  getScans,
} from "../controllers/scanController.js";
import requireAuth from "../middleware/requireAuth.js";

const scanRouter = express.Router();

scanRouter.use(requireAuth);

scanRouter.post("/", createScan);
scanRouter.get("/", getScans);
scanRouter.get("/:scanId", getScan);

export default scanRouter;