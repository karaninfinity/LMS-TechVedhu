import prisma from "../../config/prisma.js";

// Get all lessons for a chapter
export const getLessons = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { page = 1, limit = 10, search, isPublished } = req.query;

    const where = {
      chapterId: parseInt(chapterId),
    };

    if (search && search.length > 2) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    if (isPublished != null) {
      where.isPublished = isPublished == "true" ? true : false;
    }

    // Calculate pagination parameters
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count for pagination metadata
    const totalCount = await prisma.lesson.count({ where });

    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        attachments: true,
      },
      orderBy: { position: "asc" },
      skip,
      take,
    });

    res.json({
      success: true,
      message: "Lessons fetched successfully",
      data: lessons,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting lessons:", error);
    res.status(500).json({ message: "Error getting lessons" });
  }
};

// Get a single lesson by ID
export const getLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: parseInt(id) },
      include: {
        attachments: true,
        tests: {
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

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.json({
      success: true,
      message: "Lesson fetched successfully",
      data: lesson,
    });
  } catch (error) {
    console.error("Error getting lesson:", error);
    res.status(500).json({ message: "Error getting lesson" });
  }
};

// Create a new lesson
export const createLesson = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { title, content, isPublished } = req.body;

    // Handle video upload
    const videoUrl = req.files?.video?.[0]?.path?.replace("\\", "/") || null;

    // Handle attachments
    const attachmentFiles = req.files?.attachments || [];

    // Get the highest position in the chapter
    const highestPositionLesson = await prisma.lesson.findFirst({
      where: { chapterId: parseInt(chapterId) },
      orderBy: { position: "desc" },
    });

    const position = highestPositionLesson
      ? highestPositionLesson.position + 1
      : 1;

    // Create the lesson
    const lesson = await prisma.lesson.create({
      data: {
        title,
        content,
        videoUrl,
        position,
        chapterId: parseInt(chapterId),
        attachments: {
          create: attachmentFiles.map((file) => ({
            name: file.originalname,
            url: file.path.replace("\\", "/"),
            type: getAttachmentType(file.mimetype),
          })),
        },
        isPublished: isPublished === "true" ? true : false,
      },
      include: {
        attachments: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Lesson created successfully",
      data: lesson,
    });
  } catch (error) {
    console.error("Error creating lesson:", error);
    res.status(500).json({ message: "Error creating lesson" });
  }
};

// Update a lesson
export const updateLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, existingAttachments, isPublished } = req.body;
    // Parse existingAttachments if it's a string (JSON)
    const parsedAttachments = existingAttachments
      ? typeof existingAttachments === "string"
        ? JSON.parse(existingAttachments)
        : existingAttachments
      : [];
    console.log(
      "Is array:",
      Array.isArray(parsedAttachments),
      "Value:",
      parsedAttachments
    );
    // Handle video upload
    const videoUrl = req.files?.video?.[0]?.path?.replace("\\", "/");

    // Handle attachments
    const attachmentFiles = req.files?.attachments || [];

    const lesson = await prisma.lesson.findUnique({
      where: { id: parseInt(id) },
      include: {
        attachments: true,
      },
    });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Delete attachments that are not in existingAttachments
    const existingAttachmentIds = parsedAttachments.map((id) => parseInt(id));
    const attachmentsToDelete = lesson.attachments
      .filter((attachment) => !existingAttachmentIds.includes(attachment.id))
      .map((attachment) => attachment.id);

    // Create new attachments if files are provided
    let attachments = undefined;
    if (attachmentFiles.length > 0 || attachmentsToDelete.length > 0) {
      attachments = {
        create: attachmentFiles.map((file) => ({
          name: file.originalname,
          url: file.path.replace("\\", "/"),
          type: getAttachmentType(file.mimetype),
        })),
        deleteMany:
          attachmentsToDelete.length > 0
            ? {
                id: {
                  in: attachmentsToDelete,
                },
              }
            : undefined,
      };
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: parseInt(id) },
      data: {
        title,
        content,
        ...(videoUrl && { videoUrl }),
        ...(attachments && { attachments }),
        isPublished: isPublished === "true" ? true : false,
      },
      include: {
        attachments: true,
      },
    });

    res.json({
      success: true,
      message: "Lesson updated successfully",
      data: updatedLesson,
    });
  } catch (error) {
    console.error("Error updating lesson:", error);
    res.status(500).json({ message: "Error updating lesson" });
  }
};

// Delete a lesson
export const deleteLesson = async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: parseInt(id) },
    });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    await prisma.lesson.delete({
      where: { id: parseInt(id) },
    });

    // Reorder remaining lessons
    const remainingLessons = await prisma.lesson.findMany({
      where: {
        chapterId: lesson.chapterId,
        position: { gt: lesson.position },
      },
      orderBy: { position: "asc" },
    });

    for (const les of remainingLessons) {
      await prisma.lesson.update({
        where: { id: les.id },
        data: { position: les.position - 1 },
      });
    }

    res.json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    res.status(500).json({ message: "Error deleting lesson" });
  }
};

// Publish/Unpublish a lesson
export const togglePublish = async (req, res) => {
  try {
    const { id } = req.params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: parseInt(id) },
    });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const updatedLesson = await prisma.lesson.update({
      where: { id: parseInt(id) },
      data: {
        isPublished: !lesson.isPublished,
      },
    });

    res.json({
      success: true,
      message: "Lesson publish status updated successfully",
      data: updatedLesson,
    });
  } catch (error) {
    console.error("Error toggling lesson publish status:", error);
    res.status(500).json({ message: "Error updating lesson" });
  }
};

// Reorder lessons
export const reorderLessons = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const { lessonIds } = req.body;

    if (!Array.isArray(lessonIds)) {
      return res.status(400).json({ message: "lessonIds must be an array" });
    }

    // Verify all lessons belong to the chapter
    const lessons = await prisma.lesson.findMany({
      where: {
        chapterId: parseInt(chapterId),
        id: { in: lessonIds.map((id) => parseInt(id)) },
      },
    });

    if (lessons.length !== lessonIds.length) {
      return res
        .status(400)
        .json({ message: "Some lessons don't belong to this chapter" });
    }

    // Update positions
    for (let i = 0; i < lessonIds.length; i++) {
      await prisma.lesson.update({
        where: { id: parseInt(lessonIds[i]) },
        data: { position: i + 1 },
      });
    }

    res.json({
      success: true,
      message: "Lessons reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering lessons:", error);
    res.status(500).json({ message: "Error reordering lessons" });
  }
};

// Helper function to determine attachment type
const getAttachmentType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "IMAGE";
  if (mimetype.startsWith("video/")) return "VIDEO";
  if (
    mimetype.startsWith("application/pdf") ||
    mimetype.includes("document") ||
    mimetype.includes("text/")
  )
    return "DOCUMENT";
  return "LINK";
};
