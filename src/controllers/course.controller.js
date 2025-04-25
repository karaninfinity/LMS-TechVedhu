import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all courses (with optional filters)
export const getCourses = async (req, res) => {
  try {
    const { search, instructorId } = req.query;

    const where = {
      isPublished: true,
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(instructorId && { instructorId: parseInt(instructorId) }),
    };

    const courses = await prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        chapters: {
          where: { isPublished: true },
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(courses);
  } catch (error) {
    console.error("Error getting courses:", error);
    res.status(500).json({ message: "Error getting courses" });
  }
};

// Get a single course by ID
export const getCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        chapters: {
          where: { isPublished: true },
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { position: "asc" },
              include: {
                attachments: true,
              },
            },
          },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error getting course:", error);
    res.status(500).json({ message: "Error getting course" });
  }
};

// Create a new course
export const createCourse = async (req, res) => {
  try {
    const { title, description, instructorId } = req.body;
    let coverImage = null;

    // Handle file upload if present
    if (req.file) {
      coverImage = req.file.path.replace("\\", "/");
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        coverImage,
        instructorId: parseInt(instructorId),
      },
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Error creating course" });
  }
};

// Update a course
export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    let updateData = { title, description };

    // Check if user is the course instructor
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (req.file) {
      updateData.coverImage = req.file.path.replace("\\", "/");
    }

    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.json({
      success: true,
      message: "Course updated successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Error updating course" });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await prisma.course.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Course deleted successfully",
      data: course,
    });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Error deleting course" });
  }
};

// Publish/Unpublish a course
export const togglePublish = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is the course instructor
    const course = await prisma.course.findUnique({
      where: { id: parseInt(id) },
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const updatedCourse = await prisma.course.update({
      where: { id: parseInt(id) },
      data: {
        isPublished: !course.isPublished,
      },
    });

    res.json({
      success: true,
      message: "Status changed successfully",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error toggling course publish status:", error);
    res.status(500).json({ message: "Error updating course" });
  }
};
