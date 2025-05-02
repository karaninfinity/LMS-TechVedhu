import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import {
  sendMessage,
  getMessages,
  getConversations,
  markAsRead,
  deleteMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Send a message
router.post("/", sendMessage);

// Get messages between current user and another user
router.get("/", getMessages);

// Get user's conversations
router.get("/conversations", getConversations);

// Mark message as read
router.patch("/:messageId/read", markAsRead);

// Delete message
router.delete("/:messageId", deleteMessage);

export default router;
