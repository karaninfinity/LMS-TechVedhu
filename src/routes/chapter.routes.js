import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  getChapters,
  getChapter,
  createChapter,
  updateChapter,
  deleteChapter,
  togglePublish,
  reorderChapters,
} from "../controllers/chapter.controller.js";

const router = express.Router({ mergeParams: true });

// Public routes
router.get("/", getChapters);
router.get("/:id", getChapter);
router.post("/", createChapter);
router.put("/:id", updateChapter);
router.delete("/:id", deleteChapter);
router.patch("/:id/publish", togglePublish);
router.post("/reorder", reorderChapters);

export default router;
