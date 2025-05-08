import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import { Status } from "@prisma/client";
export const getUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 10, search } = req.query;

    const where = {};

    if (role) {
      where.role = role;
    }

    if (search && search.length > 2) {
      // MySQL doesn't support 'insensitive' mode with Prisma
      // The search is not working because MySQL requires different syntax
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        {
          AND: [
            { firstName: { contains: search.split(" ")[0] || "" } },
            { lastName: { contains: search.split(" ")[1] || "" } },
          ],
        },
      ];
    }

    if (isActive != null) {
      where.status = isActive == "true" ? Status.ACTIVE : Status.INACTIVE;
    }

    // Calculate pagination parameters
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count for pagination metadata
    const totalCount = await prisma.user.count({ where });

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      skip,
      take,
    });

    res.json({
      message: "Users fetched successfully",
      success: true,
      data: users,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
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
