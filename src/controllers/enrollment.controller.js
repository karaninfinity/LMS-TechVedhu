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
          userId: Number(userId),
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
          userId: Number(userId),
          courseId: Number(courseId),
        },
      },
      data: {
        status: status,
        progress: status === EnrollmentStatus.COMPLETED ? 100 : 0,
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
          userId: Number(userId),
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
          userId: Number(userId),
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

export const enrollChapter = async (req, res) => {
  try {
    const { chapterId, courseId, userId } = req.body;

    // Check if user is enrolled in the course
    const courseEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: Number(userId),
          courseId: Number(courseId),
        },
      },
    });

    if (!courseEnrollment) {
      return res.status(404).json({ message: "Course enrollment not found" });
    }

    // Check if chapter exists in the course
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: Number(chapterId),
        courseId: Number(courseId),
      },
    });

    if (!chapter) {
      return res
        .status(404)
        .json({ message: "Chapter not found in this course" });
    }

    // Check if already enrolled in chapter
    const existingChapterEnrollment = await prisma.chapterEnrollment.findFirst({
      where: {
        enrollmentId: courseEnrollment.id,
        chapterId: Number(chapterId),
      },
    });

    if (existingChapterEnrollment) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this chapter" });
    }

    // Create chapter enrollment
    const chapterEnrollment = await prisma.chapterEnrollment.create({
      data: {
        enrollmentId: courseEnrollment.id,
        chapterId: Number(chapterId),
        status: "ENROLLED",
        progress: 0,
      },
      include: {
        chapter: {
          select: {
            title: true,
            description: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Successfully enrolled in chapter",
      chapterEnrollment,
    });
  } catch (error) {
    console.error("Chapter enrollment error:", error);
    res.status(500).json({ message: "Error enrolling in chapter" });
  }
};

export const enrollLesson = async (req, res) => {
  try {
    const { lessonId, chapterId, userId } = req.body;

    // Find the enrollment first
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: Number(userId),
      },
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Check if user is enrolled in the chapter
    const chapterEnrollment = await prisma.chapterEnrollment.findFirst({
      where: {
        enrollmentId: enrollment.id,
        chapterId: Number(chapterId),
      },
    });

    if (!chapterEnrollment) {
      return res.status(404).json({ message: "Chapter enrollment not found" });
    }

    // Check if lesson exists in the chapter
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: Number(lessonId),
        chapterId: Number(chapterId),
      },
    });

    if (!lesson) {
      return res
        .status(404)
        .json({ message: "Lesson not found in this chapter" });
    }

    // Check if already enrolled in lesson
    const existingLessonEnrollment = await prisma.lessonEnrollment.findFirst({
      where: {
        chapterEnrollmentId: chapterEnrollment.id,
        lessonId: Number(lessonId),
      },
    });

    if (existingLessonEnrollment) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this lesson" });
    }

    // Create lesson enrollment
    const lessonEnrollment = await prisma.lessonEnrollment.create({
      data: {
        chapterEnrollmentId: chapterEnrollment.id,
        lessonId: Number(lessonId),
        status: "ENROLLED",
        isCompleted: false,
      },
      include: {
        lesson: {
          select: {
            title: true,
            content: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Successfully enrolled in lesson",
      lessonEnrollment,
    });
  } catch (error) {
    console.error("Lesson enrollment error:", error);
    res.status(500).json({ message: "Error enrolling in lesson" });
  }
};

export const updateChapterEnrollmentStatus = async (req, res) => {
  try {
    const { chapterId, status, userId } = req.body;

    // Validate status
    if (!Object.values(["ENROLLED", "COMPLETED", "DROPPED"]).includes(status)) {
      return res.status(400).json({ message: "Invalid enrollment status" });
    }

    // Find the enrollment first
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: Number(userId),
      },
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Check if chapter enrollment exists
    const chapterEnrollment = await prisma.chapterEnrollment.findFirst({
      where: {
        enrollmentId: enrollment.id,
        chapterId: Number(chapterId),
      },
    });

    if (!chapterEnrollment) {
      return res.status(404).json({ message: "Chapter enrollment not found" });
    }

    // Update chapter enrollment status
    const updatedChapterEnrollment = await prisma.chapterEnrollment.update({
      where: {
        id: chapterEnrollment.id,
      },
      data: {
        status: status,
      },
    });

    res.json({
      message: "Chapter enrollment status updated successfully",
      chapterEnrollment: updatedChapterEnrollment,
    });
  } catch (error) {
    console.error("Error updating chapter enrollment status:", error);
    res
      .status(500)
      .json({ message: "Error updating chapter enrollment status" });
  }
};

export const updateLessonEnrollmentStatus = async (req, res) => {
  try {
    const { lessonId, status, userId, completed } = req.body;

    // Validate status
    if (!Object.values(["ENROLLED", "COMPLETED", "DROPPED"]).includes(status)) {
      return res.status(400).json({ message: "Invalid enrollment status" });
    }

    // Find the enrollment and chapter enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: Number(userId),
      },
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    // Find the chapter for this lesson
    const lesson = await prisma.lesson.findUnique({
      where: {
        id: Number(lessonId),
      },
      select: {
        chapterId: true,
      },
    });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const chapterEnrollment = await prisma.chapterEnrollment.findFirst({
      where: {
        enrollmentId: enrollment.id,
        chapterId: lesson.chapterId,
      },
    });

    if (!chapterEnrollment) {
      return res.status(404).json({ message: "Chapter enrollment not found" });
    }

    // Check if lesson enrollment exists
    const lessonEnrollment = await prisma.lessonEnrollment.findFirst({
      where: {
        chapterEnrollmentId: chapterEnrollment.id,
        lessonId: Number(lessonId),
      },
    });

    if (!lessonEnrollment) {
      return res.status(404).json({ message: "Lesson enrollment not found" });
    }

    // Update lesson enrollment status
    const updatedLessonEnrollment = await prisma.lessonEnrollment.update({
      where: {
        id: lessonEnrollment.id,
      },
      data: {
        status: status,
        ...(completed !== undefined && { isCompleted: Boolean(completed) }),
      },
    });

    res.json({
      message: "Lesson enrollment status updated successfully",
      lessonEnrollment: updatedLessonEnrollment,
    });
  } catch (error) {
    console.error("Error updating lesson enrollment status:", error);
    res
      .status(500)
      .json({ message: "Error updating lesson enrollment status" });
  }
};

export const getChapterEnrollment = async (req, res) => {
  try {
    const { courseId, userId } = req.query;
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: parseInt(userId),
        courseId: parseInt(courseId),
      },
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const chapterEnrollments = await prisma.chapterEnrollment.findMany({
      where: {
        enrollmentId: enrollment.id,
      },
      include: {
        chapter: true,
      },
    });

    res.json({
      message: "Chapter enrollment retrieved successfully",
      chapterEnrollments,
    });
  } catch (error) {
    console.error("Error fetching chapter enrollment:", error);
    res.status(500).json({ message: "Error fetching chapter enrollment" });
  }
};

export const getLessonEnrollment = async (req, res) => {
  try {
    const { lessonId, userId, courseId, chapterId } = req.query;

    const enrollwhere = {
      ...(userId && { userId: parseInt(userId) }),
      ...(courseId && { courseId: parseInt(courseId) }),
    };
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: parseInt(userId),
        courseId: parseInt(courseId),
      },
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    const chapterEnrollWhere = {
      ...(enrollment && { enrollmentId: enrollment.id }),
      ...(chapterId && { chapterId: parseInt(chapterId) }),
    };

    const chapterEnrollment = await prisma.chapterEnrollment.findFirst({
      where: chapterEnrollWhere,
    });

    const lessonEnrollments = await prisma.lessonEnrollment.findMany({
      where: {
        chapterEnrollmentId: chapterEnrollment.id,
      },
      include: {
        lesson: true,
      },
    });

    res.json({
      message: "Lesson enrollment retrieved successfully",
      lessonEnrollments,
    });
  } catch (error) {
    console.error("Error fetching lesson enrollment:", error);
    res.status(500).json({ message: "Error fetching lesson enrollment" });
  }
};
