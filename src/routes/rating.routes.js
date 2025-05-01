import express from "express";
import {
  rateCourse,
  getCourseRatings,
  rateInstructor,
  getInstructorRatings,
} from "../controllers/rating.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Course rating routes
router.post("/course", rateCourse);
router.get("/course/:courseId", getCourseRatings);

// Instructor rating routes
router.post("/instructor", rateInstructor);
router.get("/instructor/:instructorId", getInstructorRatings);

export default router;
