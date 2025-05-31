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

    try {
      const admin = await prisma.user.findFirst({
        where: {
          role: Role.ADMIN,
        },
      });

      // Different content based on user role
      let roleSpecificContent = "";
      let headerColor = "";
      let headerTitle = "";

      if (role === Role.INSTRUCTOR) {
        headerColor = "#1554a4"; // Green for instructors
        headerTitle = "Welcome to Our Instructor Community";
        roleSpecificContent = `
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            As an instructor, you now have the ability to:
          </p>
          <ul style="font-size: 16px; line-height: 1.5; color: #333;">
            <li>Create and publish engaging courses</li>
            <li>Manage chapters, lessons, and tests</li>
            <li>Interact with your students</li>
            <li>Track student progress and performance</li>
            <li>Receive ratings and feedback</li>
          </ul>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            Our platform provides you with all the tools you need to deliver high-quality education.
            You can start by creating your first course and building your teaching portfolio.
          </p>
          <div style="background-color: #e8f5e9; border-left: 4px solid #2e7d32; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #333;">
              <strong>Quick Tip:</strong> Make sure to complete your instructor profile to build credibility with potential students.
            </p>
          </div>
        `;
      } else {
        // Default student content
        headerColor = "#1554a4"; // Blue for students
        headerTitle = "Welcome to Learning Management System";
        roleSpecificContent = `
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            With your new student account, you can:
          </p>
          <ul style="font-size: 16px; line-height: 1.5; color: #333;">
            <li>Browse and enroll in a wide range of courses</li>
            <li>Track your learning progress</li>
            <li>Take tests and assessments</li>
            <li>Interact with instructors and other students</li>
          </ul>
          <p style="font-size: 16px; line-height: 1.5; color: #333;">
            We recommend starting by exploring our featured courses and enrolling in one that matches your interests.
          </p>
          <div style="background-color: #e3f2fd; border-left: 4px solid #1554a4; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #333;">
              <strong>Quick Tip:</strong> Set a learning schedule to make steady progress in your courses.
            </p>
          </div>
        `;
      }

      await transporter.sendMail({
        ...mailOptions,
        to: email,
        subject: `Welcome to Learning Management System${
          role === Role.INSTRUCTOR ? " as an Instructor" : ""
        }`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="background-color: ${headerColor}; padding: 15px; border-radius: 5px 5px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px; text-align: center;">${headerTitle}</h1>
            </div>
            <div style="padding: 20px;">
              <p style="font-size: 16px; line-height: 1.5; color: #333;">
                Dear ${firstName} ${lastName},
              </p>
              <p style="font-size: 16px; line-height: 1.5; color: #333;">
                Welcome to our Learning Management System! We're excited to have you join our community${
                  role === Role.INSTRUCTOR ? " of educators" : " of learners"
                }.
              </p>
              
              ${roleSpecificContent}
              
              <p style="font-size: 16px; line-height: 1.5; color: #333;">
                Get started by logging in to your account using your email: <strong>${email}</strong>
              </p>
              <p style="font-size: 14px; line-height: 1.5; color: #666; margin-top: 30px; text-align: center;">
                If you have any questions, please don't hesitate to contact our support team.
              </p>
            </div>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 0 0 5px 5px; text-align: center;">
              <p style="font-size: 12px; color: #666; margin: 0;">
                © ${moment().year()} Learning Management System. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });

      await transporter.sendMail({
        ...mailOptions,
        to: admin.email,
        subject: `New ${
          role === Role.INSTRUCTOR ? "Instructor" : "Student"
        } Joined`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="background-color: ${
              role === Role.INSTRUCTOR ? "#2e7d32" : "#1554a4"
            }; padding: 15px; border-radius: 5px 5px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New ${
                role === Role.INSTRUCTOR ? "Instructor" : "Student"
              } Registration</h1>
            </div>
            <div style="padding: 20px; background-color: #f9f9f9;">
              <p style="font-size: 16px; line-height: 1.5; color: #333;">Hello Admin,</p>
              <p style="font-size: 16px; line-height: 1.5; color: #333;">
                A new ${
                  role === Role.INSTRUCTOR ? "instructor" : "student"
                } has just registered on the Learning Management System.
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; border-radius: 4px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <tr style="background-color: ${
                  role === Role.INSTRUCTOR ? "#e8f5e9" : "#e3f2fd"
                };">
                  <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd;">Field</th>
                  <th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd;">Value</th>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold;">Name</td>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd;">${firstName} ${lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold;">Email</td>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd;">${email}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold;">Role</td>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd;">${role}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold;">Registration Date</td>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd;">${moment().format(
                    "MMMM Do YYYY, h:mm:ss a"
                  )}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold;">Status</td>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd;">INACTIVE (Pending Activation)</td>
                </tr>
                <tr>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold;">User ID</td>
                  <td style="padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd;">${
                    user.id
                  }</td>
                </tr>
              </table>

              <div style="background-color: ${
                role === Role.INSTRUCTOR ? "#e8f5e9" : "#e3f2fd"
              }; border-left: 4px solid ${
          role === Role.INSTRUCTOR ? "#2e7d32" : "#1554a4"
        }; margin: 20px 0; padding: 15px;">
                <p style="margin: 0; font-size: 16px; color: #333;">
                  <strong>Action Required:</strong> Please review and activate this account from the admin dashboard.
                </p>
              </div>
            </div>
            <div style="padding: 15px; text-align: center; background-color: #f1f1f1; border-radius: 0 0 5px 5px;">
              <p style="margin: 0; font-size: 14px; color: #777;">
                © ${moment().year()} Learning Management System. All rights reserved.
              </p>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
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
