import prisma from "../../config/prisma.js";

// Get all tests for a lesson
export const getTests = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const where = {
      lessonId: parseInt(lessonId),
    };

    // Calculate pagination parameters
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get total count for pagination metadata
    const totalCount = await prisma.test.count({ where });

    const tests = await prisma.test.findMany({
      where,
      include: {
        questions: {
          include: {
            options: true,
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
      success: true,
      message: "Lesson tests fetched successfully",
      data: tests,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error getting lesson tests:", error);
    res.status(500).json({ message: "Error getting lesson tests" });
  }
};

// Get a single test by ID
export const getTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await prisma.test.findUnique({
      where: { id: parseInt(id) },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!test) {
      return res.status(404).json({ message: "Lesson test not found" });
    }

    res.json({
      success: true,
      message: "Lesson test fetched successfully",
      data: test,
    });
  } catch (error) {
    console.error("Error getting lesson test:", error);
    res.status(500).json({ message: "Error getting lesson test" });
  }
};

// Create a new test
export const createTest = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const {
      title,
      description,
      timeLimit,
      passingScore,
      questions,
      isPublished,
    } = req.body;

    // Create the test with its questions and options
    const test = await prisma.test.create({
      data: {
        title,
        description,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        passingScore: passingScore ? parseInt(passingScore) : 70,
        lessonId: parseInt(lessonId),
        isPublished: isPublished,
        questions: {
          create: questions.map((q) => ({
            question: q.question,
            type: q.type,
            points: q.points || 1,
            options: {
              create: q.options.map((opt) => ({
                content: opt.content,
                isCorrect: opt.isCorrect,
                image: opt.image,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Lesson test created successfully",
      data: test,
    });
  } catch (error) {
    console.error("Error creating lesson test:", error);
    res.status(500).json({ message: "Error creating lesson test" });
  }
};

// Update a test
export const updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, timeLimit, passingScore, isPublished } =
      req.body;

    // First, verify the test exists
    const existingTest = await prisma.test.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingTest) {
      return res.status(404).json({ message: "Lesson test not found" });
    }

    // Update the test
    const updatedTest = await prisma.test.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        passingScore: passingScore ? parseInt(passingScore) : 70,
        isPublished: isPublished,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Lesson test updated successfully",
      data: updatedTest,
    });
  } catch (error) {
    console.error("Error updating lesson test:", error);
    res.status(500).json({ message: "Error updating lesson test" });
  }
};

// Delete a test
export const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await prisma.test.findUnique({
      where: { id: parseInt(id) },
    });

    if (!test) {
      return res.status(404).json({ message: "Lesson test not found" });
    }

    await prisma.test.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Lesson test deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lesson test:", error);
    res.status(500).json({ message: "Error deleting lesson test" });
  }
};

// Publish/Unpublish a test
export const togglePublish = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await prisma.test.findUnique({
      where: { id: parseInt(id) },
    });

    if (!test) {
      return res.status(404).json({ message: "Lesson test not found" });
    }

    const updatedTest = await prisma.test.update({
      where: { id: parseInt(id) },
      data: {
        isPublished: !test.isPublished,
      },
    });

    res.json({
      success: true,
      message: "Lesson test publish status updated successfully",
      data: updatedTest,
    });
  } catch (error) {
    console.error("Error toggling lesson test publish status:", error);
    res.status(500).json({ message: "Error updating lesson test" });
  }
};
