import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import { Status } from "@prisma/client";
export const getUsers = async (req, res) => {
  try {
    const {
      role,
      isActive,
      page = 1,
      limit = 10,
      search,
      instructorId,
    } = req.query;
    const where = {};
    const include = {};

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

    if (instructorId) {
      where.enrollments = {
        some: {
          course: {
            instructorId: parseInt(instructorId),
          },
        },
      };
      include.enrollments = {
        select: {
          course: {
            select: {
              title: true,
            },
          },
          progress: true,
        },
      };
      include.enrollments.where = {
        course: {
          instructorId: parseInt(instructorId),
        },
      };
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
      include,
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
        where: {
          isPublished: true,
        },
        include: {
          chapters: {
            where: {
              isPublished: true,
            },
          },
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

export const getInstructorAnalytics = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Verify the instructor exists
    const instructor = await prisma.user.findUnique({
      where: { id: parseInt(instructorId) },
    });

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    // Get all courses by this instructor
    const courses = await prisma.course.findMany({
      where: { instructorId: parseInt(instructorId) },
      include: {
        _count: {
          select: {
            enrollments: true,
            chapters: true,
            tests: true,
          },
        },
        ratings: {
          select: {
            rating: true,
          },
        },
      },
    });

    // Calculate analytics
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(
      (course) => course.isPublished
    ).length;
    const unpublishedCourses = totalCourses - publishedCourses;

    // Calculate total enrollments
    const totalEnrollments = courses.reduce(
      (sum, course) => sum + course._count.enrollments,
      0
    );

    // Calculate average rating
    let totalRatingSum = 0;
    let ratingCount = 0;

    courses.forEach((course) => {
      course.ratings.forEach((rating) => {
        totalRatingSum += rating.rating;
        ratingCount++;
      });
    });

    const averageRating =
      ratingCount > 0 ? (totalRatingSum / ratingCount).toFixed(1) : 0;

    // Get top courses by enrollment
    const topCourses = [...courses]
      .sort((a, b) => b._count.enrollments - a._count.enrollments)
      .slice(0, 5)
      .map((course) => ({
        id: course.id,
        title: course.title,
        enrollments: course._count.enrollments,
        rating:
          course.ratings.length > 0
            ? (
                course.ratings.reduce((sum, r) => sum + r.rating, 0) /
                course.ratings.length
              ).toFixed(1)
            : 0,
      }));

    // Total content metrics
    const totalChapters = courses.reduce(
      (sum, course) => sum + course._count.chapters,
      0
    );
    const totalTests = courses.reduce(
      (sum, course) => sum + course._count.tests,
      0
    );

    const analyticsData = {
      totalCourses,
      publishedCourses,
      unpublishedCourses,
      totalEnrollments,
      averageRating,
      topCourses,
      contentMetrics: {
        totalChapters,
        totalTests,
      },
    };

    res.json({
      success: true,
      message: "Instructor analytics retrieved successfully",
      data: analyticsData,
    });
  } catch (error) {
    console.error("Error getting instructor analytics:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving analytics data",
    });
  }
};
