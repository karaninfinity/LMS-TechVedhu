import express from "express";
import {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from "../controllers/question.controller.js";
import upload from "../utils/multer.js";

const router = express.Router({ mergeParams: true });

// Question routes
router.get("/", getQuestions);
router.get("/:id", getQuestion);
router.post("/", createQuestion);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);
router.post("/reorder", reorderQuestions);

export default router;
