import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma.js";
import { mailOptions, transporter } from "../../utils/mail.js";
import { generateOTP } from "../../utils/helper.js";
import moment from "moment";
import pkg from "@prisma/client";
const { Role, Status } = pkg;

export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: role || Role.STUDENT,
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );
    user.token = token;
    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error creating user" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    if (user.status === Status.INACTIVE) {
      return res.status(401).json({ message: "User is not active" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        profileImage: user.profileImage,
        username: user.firstName + " " + user.lastName,
      },
      process.env.JWT_SECRET,
      {}
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.firstName + " " + user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error logging in" });
  }
};

export const sendOTP = async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email: email },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const otp = generateOTP();
  const expiry = moment().add(10, "minutes").toDate();
  try {
    const response = await prisma.otp.upsert({
      where: {
        email: email,
      },
      update: {
        otp: otp,
        expiry: expiry,
      },
      create: {
        email: email,
        otp: otp,
        expiry: expiry,
      },
    });
    await transporter.sendMail({
      ...mailOptions,
      to: email,
      subject: "Your OTP Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="background-color: #4a7aff; padding: 15px; border-radius: 5px 5px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">OTP Verification</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p style="font-size: 16px; line-height: 1.5; color: #333;">Hello ${
              user.firstName || ""
            } ${user.lastName || ""},</p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">
              You requested a one-time password (OTP) for your Learning Management System account. 
              Please use the code below to complete your verification:
            </p>
            <div style="background-color: #e8f0fe; border: 1px dashed #4a7aff; margin: 20px 0; padding: 15px; text-align: center;">
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 0; color: #4a7aff;">
                ${response.otp}
              </p>
            </div>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">
              This code will expire in 10 minutes. If you did not request this OTP, please ignore this email or contact support.
            </p>
            <p style="font-size: 16px; line-height: 1.5; color: #333;">
              Thank you<br>
            </p>
          </div>
          <div style="padding: 15px; text-align: center; background-color: #f1f1f1; border-radius: 0 0 5px 5px;">
            <p style="margin: 0; font-size: 14px; color: #777;">
              &copy; ${moment().year()} Learning Management System. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });
    res.json({ message: "OTP sent to email", otp: response.otp });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const response = await prisma.otp.findUnique({
      where: { email: email },
    });
    if (!response) {
      return res.status(400).json({ message: "OTP not found" });
    }
    if (response.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const expiry = moment(response.expiry);
    if (expiry.isBefore(moment())) {
      await prisma.otp.delete({
        where: { email: email },
      });
      return res.status(400).json({ message: "OTP expired" });
    }
    await prisma.otp.delete({
      where: { email: email },
    });
    res.json({ message: "OTP verified" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

export const resetPassword = async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email: email },
      data: {
        password: hashedPassword,
      },
    });
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};
