import express from "express";
import {
  startTest,
  submitTest,
  getTestReport,
} from "../controllers/TestAttempt.controller.js";

const router = express.Router({ mergeParams: true });

// Test attempt routes
router.post("/tests/:testId/start", startTest);
router.post("/tests/:testId/submit", submitTest);
router.get("/tests/:testId/report", getTestReport);

export default router;
