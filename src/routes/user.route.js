import { Router } from "express";
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  updateUserStatus,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/", getUsers);

router.post("/", createUser);

router.get("/:id", getUserById);

router.put("/:id", updateUser);

router.delete("/:id", deleteUser);

router.put("/:id/status", updateUserStatus);

export default router;
