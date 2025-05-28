import express from "express";
import {
  getConfigs,
  getConfigByKey,
  upsertConfig,
  updateConfigs,
  deleteConfig,
} from "../controllers/config.controller.js";
import { authorize } from "../middleware/auth.middleware.js";
import { Role } from "@prisma/client";

const router = express.Router();

// Get all configs
router.get("/", getConfigs);

// Get config by key
router.get("/:key", getConfigByKey);

// Admin-only routes
// Create or update a config
// router.post("/", authorize([Role.ADMIN]), upsertConfig);
router.post("/", upsertConfig);

// Update multiple configs at once
// router.put("/", authorize([Role.ADMIN]), updateConfigs);
router.put("/", updateConfigs);

// Delete a config
// router.delete("/:key", authorize([Role.ADMIN]), deleteConfig);
router.delete("/:key", deleteConfig);

export default router;
