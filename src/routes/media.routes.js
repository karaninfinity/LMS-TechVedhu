import express from "express";
import upload from "../utils/multer.js";
import { uploadMedia } from "../controllers/media.controller.js";
const router = express.Router();

router.post("/", upload.single("file"), uploadMedia);

export default router;
