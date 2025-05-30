import { Router } from "express";
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
  getInstructorAnalytics,
  getUsersCSV,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/", getUsers);

router.post("/", createUser);

router.get("/:id", getUserById);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

router.put("/:id/status", updateUserStatus);

// Instructor analytics
router.get("/:instructorId/analytics", getInstructorAnalytics);

router.post("/csv", getUsersCSV);

export default router;
