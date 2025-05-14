import prisma from "../../config/prisma.js";

export const getDashboardData = async (req, res) => {
  try {
    const usersCount = await prisma.user.count({
      where: { role: "STUDENT" },
    });
    const instructorsCount = await prisma.user.count({
      where: { role: "INSTRUCTOR" },
    });
    const coursesCount = await prisma.course.count();
    const chaptersCount = await prisma.chapter.count();
    const lessonsCount = await prisma.lesson.count();
    const testsCount = await prisma.test.count();

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
