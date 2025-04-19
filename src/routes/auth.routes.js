import express from "express";
import {
  login,
  register,
  sendOTP,
  verifyOTP,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

// Send OTP route
router.post("/otp", sendOTP);

// Verify OTP route
router.post("/verify-otp", verifyOTP);

// Reset password route
router.post("/reset-password", resetPassword);

export default router;
