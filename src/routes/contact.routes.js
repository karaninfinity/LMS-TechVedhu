import express from "express";
import {
  submitContactForm,
  getContacts,
} from "../controllers/contact.controller.js";

const router = express.Router();

/**
 * @route POST /api/contact
 * @desc Submit a contact form
 * @access Public
 */
router.get("/", getContacts);
router.post("/", submitContactForm);

export default router;
