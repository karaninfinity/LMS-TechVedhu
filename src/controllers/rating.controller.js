import prisma from "../../config/prisma.js";
import pkg from "@prisma/client";
const { Role } = pkg;

// Course Rating Controllers
export const rateCourse = async (req, res) => {
  try {
    const { courseId, rating, review, userId } = req.body;
    console.log(req.body);
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Check if course exists and is published
    const course = await prisma.course.findFirst({
      where: {
        id: Number(courseId),
        isPublished: true,
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: Number(userId),
          courseId: Number(courseId),
        },
      },
    });

    if (!enrollment) {
      return res
        .status(403)
        .json({ message: "You must be enrolled in the course to rate it" });
    }

    // Create or update rating
    const courseRating = await prisma.courseRating.upsert({
      where: {
        userId_courseId: {
          userId: Number(userId),
          courseId: Number(courseId),
        },
      },
      update: {
        rating: rating,
        review: review,
      },
      create: {
        userId: Number(userId),
        courseId: Number(courseId),
        rating: rating,
        review: review,
      },
    });

    res.status(201).json({
      message: "Course rating submitted successfully",
      rating: courseRating,
    });
  } catch (error) {
    console.error("Course rating error:", error);
    res.status(500).json({ message: "Error submitting course rating" });
  }
};

export const getCourseRatings = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const where = {
      courseId: Number(courseId),
    };

    // Calculate pagination parameters
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count for pagination metadata
    const totalCount = await prisma.courseRating.count({ where });

    // Get all ratings for average calculation
    const allRatings = await prisma.courseRating.findMany({
      where,
      select: { rating: true },
    });

    // Calculate average rating
    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((acc, curr) => acc + curr.rating, 0) /
          allRatings.length
        : 0;

    // Calculate star distribution
    const starCounts = [5, 4, 3, 2, 1].map((star) => {
      const count = allRatings.filter((r) => r.rating === star).length;
      return { star, count };
    });

    // Get paginated ratings
    const ratings = await prisma.courseRating.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    });

    res.json({
      message: "Course ratings retrieved successfully",
      averageRating: Number(averageRating.toFixed(1)),
      totalRatings: totalCount,
      totalstarratings: starCounts,
      ratings: ratings,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching course ratings:", error);
    res.status(500).json({ message: "Error fetching course ratings" });
  }
};

// Instructor Rating Controllers
export const rateInstructor = async (req, res) => {
  try {
    const { instructorId, rating, review, userId } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Check if instructor exists and is actually an instructor
    const instructor = await prisma.user.findFirst({
      where: {
        id: Number(instructorId),
        role: Role.INSTRUCTOR,
      },
    });

    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    // Check if user has taken any course from this instructor
    const hasEnrolledCourse = await prisma.enrollment.findFirst({
      where: {
        userId: Number(userId),
        course: {
          instructorId: Number(instructorId),
        },
      },
    });

    if (!hasEnrolledCourse) {
      return res.status(403).json({
        message:
          "You must be enrolled in at least one course from this instructor to rate them",
      });
    }

    // Create or update rating
    const instructorRating = await prisma.instructorRating.upsert({
      where: {
        userId_instructorId: {
          userId: Number(userId),
          instructorId: Number(instructorId),
        },
      },
      update: {
        rating: rating,
        review: review,
      },
      create: {
        userId: Number(userId),
        instructorId: Number(instructorId),
        rating: rating,
        review: review,
      },
    });

    res.status(201).json({
      message: "Instructor rating submitted successfully",
      rating: instructorRating,
    });
  } catch (error) {
    console.error("Instructor rating error:", error);
    res.status(500).json({ message: "Error submitting instructor rating" });
  }
};

export const getInstructorRatings = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const where = {
      instructorId: Number(instructorId),
    };

    // Calculate pagination parameters
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count for pagination metadata
    const totalCount = await prisma.instructorRating.count({ where });

    // Get all ratings for average calculation
    const allRatings = await prisma.instructorRating.findMany({
      where,
      select: { rating: true },
    });

    // Calculate average rating
    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((acc, curr) => acc + curr.rating, 0) /
          allRatings.length
        : 0;

    // Get paginated ratings
    const ratings = await prisma.instructorRating.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take,
    });

    res.json({
      message: "Instructor ratings retrieved successfully",
      averageRating: Number(averageRating.toFixed(1)),
      totalRatings: totalCount,
      ratings: ratings,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching instructor ratings:", error);
    res.status(500).json({ message: "Error fetching instructor ratings" });
  }
};
