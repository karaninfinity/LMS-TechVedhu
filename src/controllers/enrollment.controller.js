import prisma from "../../config/prisma.js";
import { EnrollmentStatus } from "@prisma/client";

export const enrollCourse = async (req, res) => {
  try {
    const { courseId, userId } = req.body;

    // Check if course exists and is published
    const course = await prisma.course.findFirst({
      where: {
        id: Number(courseId),
        isPublished: true,
      },
    });

    if (!course) {
      return res
        .status(404)
        .json({ message: "Course not found or not available" });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: Number(courseId),
        },
      },
    });

    if (existingEnrollment) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this course" });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: userId,
        courseId: Number(courseId),
        status: EnrollmentStatus.ENROLLED,
        progress: 0,
      },
      include: {
        course: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Successfully enrolled in course",
      enrollment,
    });
  } catch (error) {
    console.error("Enrollment error:", error);
    res.status(500).json({ message: "Error enrolling in course" });
  }
};

export const getMyEnrollments = async (req, res) => {
  try {
    const { userId } = req.query;

    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: parseInt(userId),
      },
      include: {
        course: {
          select: {
            title: true,
            id: true,
            description: true,
            coverImage: true,
            instructor: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    res.json({
      message: "Enrollments retrieved successfully",
      enrollments,
    });
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ message: "Error fetching enrollments" });
  }
};

export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { courseId, status, userId } = req.body;

    // Validate status
    if (!Object.values(EnrollmentStatus).includes(status)) {
      return res.status(400).json({ message: "Invalid enrollment status" });
    }

    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: Number(courseId),
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Update enrollment status
    const updatedEnrollment = await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: Number(courseId),
        },
      },
      data: {
        status: status,
      },
    });

    res.json({
      message: "Enrollment status updated successfully",
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Error updating enrollment status:", error);
    res.status(500).json({ message: "Error updating enrollment status" });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const { courseId, progress, userId } = req.body;

    // Validate progress
    if (progress < 0 || progress > 100) {
      return res
        .status(400)
        .json({ message: "Progress must be between 0 and 100" });
    }

    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: Number(courseId),
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Update progress
    const updatedEnrollment = await prisma.enrollment.update({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: Number(courseId),
        },
      },
      data: {
        progress: Number(progress),
      },
    });

    res.json({
      message: "Progress updated successfully",
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ message: "Error updating progress" });
  }
};
