import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import { getDashboardData } from "../controllers/dashboard.controller.js";

const router = express.Router();

// All enrollment routes require authentication
router.use(auth);

// Get dashboard data
router.get("/", getDashboardData);

export default router;
