import prisma from "../../config/prisma.js";

// Get all chapters for a course
export const getChapters = async (req, res) => {
  try {
    const { courseId } = req.params;

    const where = {
      courseId: parseInt(courseId),
    };

    if (req.query.isPublished) {
      where.isPublished = req.query.isPublished === "true";
    }
    const chapters = await prisma.chapter.findMany({
      where,
      include: {
        course: true,
        lessons: {
          where: { isPublished: true },
          select: { id: true, title: true, position: true },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { position: "asc" },
    });

    res.json({
      success: true,
      message: "Chapter fetched successfully",
      data: chapters,
    });
  } catch (error) {
    console.error("Error getting chapters:", error);
    res.status(500).json({ message: "Error getting chapters" });
  }
};

// Get a single chapter by ID
export const getChapter = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(id) },
      include: {
        lessons: {
          where: { isPublished: true },
          include: {
            attachments: true,
          },
          orderBy: { position: "asc" },
        },
        tests: {
          where: { isPublished: true },
          include: {
            questions: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    res.json({
      success: true,
      message: "Chapter fetched successfully",
      data: chapter,
    });
  } catch (error) {
    console.error("Error getting chapter:", error);
    res.status(500).json({ message: "Error getting chapter" });
  }
};

// Create a new chapter
export const createChapter = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, isPublished } = req.body;
    const coverImage = req.file ? req.file.path?.replace("\\", "/") : null;

    // Get the highest position in the course
    const highestPositionChapter = await prisma.chapter.findFirst({
      where: { courseId: parseInt(courseId) },
      orderBy: { position: "desc" },
    });

    const position = highestPositionChapter
      ? highestPositionChapter.position + 1
      : 1;

    const chapter = await prisma.chapter.create({
      data: {
        title,
        isPublished: isPublished === "true" ? true : false,
        description,
        coverImage,
        position,
        courseId: parseInt(courseId),
      },
    });

    res.status(201).json({
      success: true,
      message: "Chapter created successfully",
      data: chapter,
    });
  } catch (error) {
    console.error("Error creating chapter:", error);
    res.status(500).json({ message: "Error creating chapter" });
  }
};

// Update a chapter
export const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isPublished } = req.body;
    const coverImage = req.file ? req.file.path.replace("\\", "/") : undefined;

    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(id) },
      include: { course: true },
    });

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const updatedChapter = await prisma.chapter.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        isPublished: isPublished === "true" ? true : false,
        ...(coverImage && { coverImage }),
      },
    });

    res.json({
      success: true,
      message: "Chapter updated successfully",
      data: updatedChapter,
    });
  } catch (error) {
    console.error("Error updating chapter:", error);
    res.status(500).json({ message: "Error updating chapter" });
  }
};

// Delete a chapter
export const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(id) },
      include: { course: true },
    });

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    await prisma.chapter.delete({
      where: { id: parseInt(id) },
    });

    // Reorder remaining chapters
    const remainingChapters = await prisma.chapter.findMany({
      where: {
        courseId: chapter.courseId,
        position: { gt: chapter.position },
      },
      orderBy: { position: "asc" },
    });

    for (const ch of remainingChapters) {
      await prisma.chapter.update({
        where: { id: ch.id },
        data: { position: ch.position - 1 },
      });
    }

    res.json({
      success: true,
      message: "Chapter deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chapter:", error);
    res.status(500).json({ message: "Error deleting chapter" });
  }
};

// Publish/Unpublish a chapter
export const togglePublish = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await prisma.chapter.findUnique({
      where: { id: parseInt(id) },
      include: { course: true },
    });

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    const updatedChapter = await prisma.chapter.update({
      where: { id: parseInt(id) },
      data: {
        isPublished: !chapter.isPublished,
      },
    });

    res.json({
      success: true,
      message: "Chapter publish status updated successfully",
      data: updatedChapter,
    });
  } catch (error) {
    console.error("Error toggling chapter publish status:", error);
    res.status(500).json({ message: "Error updating chapter" });
  }
};

// Reorder chapters
export const reorderChapters = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { chapterIds } = req.body;

    if (!Array.isArray(chapterIds)) {
      return res.status(400).json({ message: "chapterIds must be an array" });
    }

    // Verify all chapters belong to the course
    const chapters = await prisma.chapter.findMany({
      where: {
        courseId: parseInt(courseId),
        id: { in: chapterIds.map((id) => parseInt(id)) },
      },
    });

    if (chapters.length !== chapterIds.length) {
      return res
        .status(400)
        .json({ message: "Some chapters don't belong to this course" });
    }

    // Update positions
    for (let i = 0; i < chapterIds.length; i++) {
      await prisma.chapter.update({
        where: { id: parseInt(chapterIds[i]) },
        data: { position: i + 1 },
      });
    }

    res.json({
      success: true,
      message: "Chapters reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering chapters:", error);
    res.status(500).json({ message: "Error reordering chapters" });
  }
};
