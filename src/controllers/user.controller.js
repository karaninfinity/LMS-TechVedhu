import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import { Status } from "@prisma/client";
export const getUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (isActive === "true") {
      where.status = Status.ACTIVE;
    }

    const users = await prisma.user.findMany({
      where,
    });
    res.json({
      message: "Users fetched successfully",
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", success: false });
  }
};

export const createUser = async (req, res) => {
  const { email, password, firstName, lastName, role, profileImage } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
      profileImage: profileImage,
      role: role,
    },
  });
  res.json({ message: "User created successfully", success: true, data: user });
};

export const getUserById = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      courses: {
        include: {
          chapters: true,
        },
      },
      testAttempts: true,
      receivedRatings: {
        include: {
          user: true,
        },
      },
    },
  });
  res.json({ message: "User fetched successfully", success: true, data: user });
};

export const updateUser = async (req, res) => {
  const { email, firstName, lastName, role, profileImage } = req.body;
  const user = await prisma.user.update({
    where: { id: parseInt(req.params.id) },
    data: {
      email: email,
      firstName: firstName,
      lastName: lastName,
      profileImage: profileImage,
      role: role,
    },
  });
  res.json({ message: "User updated successfully", success: true, data: user });
};

export const deleteUser = async (req, res) => {
  const user = await prisma.user.delete({
    where: { id: parseInt(req.params.id) },
  });
  res.json({ message: "User deleted successfully", success: true, data: user });
};

export const updateUserStatus = async (req, res) => {
  const { status } = req.body;
  const user = await prisma.user.update({
    where: { id: parseInt(req.params.id) },
    data: {
      status: status,
    },
  });
  res.json({
    message: "User status updated successfully",
    success: true,
    data: user,
  });
};
