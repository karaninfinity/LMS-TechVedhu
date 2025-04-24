import jwt from "jsonwebtoken";
import prisma from "../../config/prisma.js";

export const auth = async (req, res, next) => {
  try {
    // const token = req.header("Authorization")?.replace("Bearer ", "");

    // if (!token) {
    //   return res.status(401).json({ message: "Authentication required" });
    // }

    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // const user = await prisma.user.findUnique({
    //   where: { id: decoded.userId },
    //   select: {
    //     id: true,
    //     username: true,
    //     email: true,
    //     role: true,
    //   },
    // });

    // if (!user) {
    //   throw new Error();
    // }

    // req.user = user;
    // req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ message: "Please authenticate" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};
