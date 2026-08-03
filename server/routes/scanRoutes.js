import express from "express";

import {
  createScan,
  deleteScan,
  getScan,
  getScans,
} from "../controllers/scanController.js";

import requireAuth from "../middleware/requireAuth.js";

const scanRouter =
  express.Router();

scanRouter.use(
  requireAuth,
);

scanRouter.post(
  "/",
  createScan,
);

scanRouter.get(
  "/",
  getScans,
);

scanRouter.get(
  "/:scanId",
  getScan,
);

scanRouter.delete(
  "/:scanId",
  deleteScan,
);

export default scanRouter;