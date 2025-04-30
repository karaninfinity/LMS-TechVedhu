import express from "express";
import {
  startTest,
  submitTest,
  getTestReport,
  getUserTests,
} from "../controllers/TestAttempt.controller.js";

const router = express.Router({ mergeParams: true });

// Test attempt routes
router.post("/:testId/start", startTest);
router.post("/:testId/submit", submitTest);
router.get("/:testId/report", getTestReport);
router.get("/user", getUserTests);
export default router;
