import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
} from "../controllers/course.controller.js";
import upload from "../utils/multer.js";
import chapterRoutes from "./chapter.routes.js";

const router = express.Router();

// Public routes
router.get("/", getCourses);
router.get("/:id", getCourse);

// Mount chapter routes
router.use("/:courseId/chapters", chapterRoutes);

// Protected routes (require authentication)
router.use(auth);

// Instructor only routes
router.post("/", upload.single("coverImage"), createCourse);
router.put("/:id", upload.single("coverImage"), updateCourse);
router.delete("/:id", deleteCourse);
router.patch("/:id/publish", togglePublish);

export default router;
