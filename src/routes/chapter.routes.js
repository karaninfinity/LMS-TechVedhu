import express from "express";
import {
  getChapters,
  getChapter,
  createChapter,
  updateChapter,
  deleteChapter,
  togglePublish,
  reorderChapters,
} from "../controllers/chapter.controller.js";
import upload from "../utils/multer.js";

const router = express.Router({ mergeParams: true });

// Public routes
router.get("/", getChapters);
router.get("/:id", getChapter);
router.post("/", upload.single("coverImage"), createChapter);
router.put("/:id", upload.single("coverImage"), updateChapter);
router.delete("/:id", deleteChapter);
router.patch("/:id/publish", togglePublish);
router.post("/reorder", reorderChapters);

export default router;
