import express from "express";

import {
  createScan,
  deleteScan,
  getScan,
  getScans,
} from "../controllers/scanController.js";

import {
  downloadScanReport,
  getExportedReports,
  openExportedReport,
} from "../controllers/reportController.js";

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

/*
 * Exported report history.
 *
 * These routes must remain above /:scanId.
 */
scanRouter.get(
  "/exports",
  getExportedReports,
);

scanRouter.get(
  "/exports/:reportId",
  openExportedReport,
);

/*
 * Generate and record a new export.
 */
scanRouter.get(
  "/:scanId/report",
  downloadScanReport,
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