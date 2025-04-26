import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";
export const getUsers = async (req, res) => {
  const query = req.query;

  const users = await prisma.user.findMany({
    where: {
      ...query,
    },
  });
  res.json({
    message: "Users fetched successfully",
    success: true,
    data: users,
  });
};

export const createUser = async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: email,
      password: hashedPassword,
      firstName: firstName,
      lastName: lastName,
      role: role,
    },
  });
  res.json({ message: "User created successfully", success: true, data: user });
};

export const getUserById = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: parseInt(req.params.id) },
  });
  res.json({ message: "User fetched successfully", success: true, data: user });
};

export const updateUser = async (req, res) => {
  const { email, firstName, lastName, role } = req.body;
  const user = await prisma.user.update({
    where: { id: parseInt(req.params.id) },
    data: {
      email: email,
      firstName: firstName,
      lastName: lastName,
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
