import express from "express";
import {
  getTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  togglePublish,
} from "../controllers/test.controller.js";
import questionRoutes from "./question.routes.js";
const router = express.Router({ mergeParams: true });

// router.use("/:testId/questions", questionRoutes);
// Public routes
router.get("/", getTests);
router.get("/:id", getTest);
router.post("/", createTest);
router.put("/:id", updateTest);
router.delete("/:id", deleteTest);
router.patch("/:id/publish", togglePublish);

export default router;
