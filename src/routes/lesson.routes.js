import express from "express";
import {
  getLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  togglePublish,
  reorderLessons,
} from "../controllers/lesson.controller.js";
import upload from "../utils/multer.js";

const router = express.Router({ mergeParams: true });

// Public routes
router.get("/", getLessons);
router.get("/:id", getLesson);
router.post(
  "/",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "attachments", maxCount: 5 },
  ]),
  createLesson
);
router.put(
  "/:id",
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "attachments", maxCount: 5 },
  ]),
  updateLesson
);
router.delete("/:id", deleteLesson);
router.patch("/:id/publish", togglePublish);
router.post("/reorder", reorderLessons);

export default router;
