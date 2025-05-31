import moment from "moment";
import prisma from "../../config/prisma.js";

export const getDashboardData = async (req, res) => {
  try {
    const { days } = req.query;
    let dateFilter = {};

    switch (days) {
      case "today":
        dateFilter = {
          createdAt: {
            gte: moment().startOf("day").toDate(),
            lte: moment().endOf("day").toDate(),
          },
        };
        break;
      case "last7days":
        dateFilter = {
          createdAt: {
            gte: moment().subtract(7, "days").toDate(),
            lte: moment().toDate(),
          },
        };
        break;
      case "last28days":
        dateFilter = {
          createdAt: {
            gte: moment().subtract(28, "days").toDate(),
            lte: moment().toDate(),
          },
        };
        break;
      case "last30days":
        dateFilter = {
          createdAt: {
            gte: moment().subtract(30, "days").toDate(),
            lte: moment().toDate(),
          },
        };
        break;
      case "last90days":
        dateFilter = {
          createdAt: {
            gte: moment().subtract(90, "days").toDate(),
            lte: moment().toDate(),
          },
        };
        break;
      default:
        dateFilter = {};
    }

    const usersCount = await prisma.user.count({
      where: {
        role: "STUDENT",
        ...dateFilter,
      },
    });
    const instructorsCount = await prisma.user.count({
      where: { role: "INSTRUCTOR", ...dateFilter },
    });
    const coursesCount = await prisma.course.count({
      where: { ...dateFilter },
    });
    const chaptersCount = await prisma.chapter.count({
      where: { ...dateFilter },
    });
    const lessonsCount = await prisma.lesson.count({
      where: { ...dateFilter },
    });
    const testsCount = await prisma.test.count({
      where: { ...dateFilter },
    });

    res.json({
      success: true,
      message: "Dashboard data retrieved successfully",
      data: {
        users: usersCount,
        instructors: instructorsCount,
        courses: coursesCount,
        chapters: chaptersCount,
        lessons: lessonsCount,
        tests: testsCount,
      },
    });
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    res.status(500).json({ message: "Error getting dashboard data" });
  }
};
