import express from "express";
import {
  enrollCourse,
  getMyEnrollments,
  updateEnrollmentStatus,
  updateProgress,
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

export default router;
