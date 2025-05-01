import express from "express";
import {
  enrollCourse,
  getMyEnrollments,
  updateEnrollmentStatus,
  updateProgress,
  enrollChapter,
  enrollLesson,
  updateChapterEnrollmentStatus,
  getChapterEnrollment,
  getLessonEnrollment,
  updateLessonEnrollmentStatus,
} from "../controllers/enrollment.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

// All enrollment routes require authentication
router.use(auth);

// Enroll in a course
router.post("/", enrollCourse);

// Get user's enrolled courses
router.get("/my-enrollments", getMyEnrollments);

// Update enrollment status (complete/drop)
router.patch("/status", updateEnrollmentStatus);

// Update course progress
router.patch("/progress", updateProgress);

// Enroll in a chapter within a course
router.post("/chapter", enrollChapter);

// Enroll in a lesson within a chapter
router.post("/lesson", enrollLesson);

// Update chapter enrollment status
router.patch("/chapter/status", updateChapterEnrollmentStatus);

// Update lesson enrollment status
router.patch("/lesson/status", updateLessonEnrollmentStatus);

// Get chapter enrollment
router.get("/chapters", getChapterEnrollment);

// Get lesson enrollment
router.get("/lessons", getLessonEnrollment);

export default router;
