import prisma from "../../config/prisma.js";

// Get all tests for a chapter
export const getTests = async (req, res) => {
  try {
    const { chapterId } = req.params;
    console.log(req.params);
    const tests = await prisma.test.findMany({
      where: {
        chapterId: parseInt(chapterId),
      },
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
    });

    res.json({
      success: true,
      message: "Tests fetched successfully",
      data: tests,
    });
  } catch (error) {
    console.error("Error getting tests:", error);
    res.status(500).json({ message: "Error getting tests" });
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
      return res.status(404).json({ message: "Test not found" });
    }

    res.json({
      success: true,
      message: "Test fetched successfully",
      data: test,
    });
  } catch (error) {
    console.error("Error getting test:", error);
    res.status(500).json({ message: "Error getting test" });
  }
};

// Create a new test
export const createTest = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const {
      title,
      description,
      timeLimit,
      passingScore,
      questions,
      isPublished,
    } = req.body;
    console.log(req.body);
    console.log(req.params);
    // Create the test with its questions and options
    const test = await prisma.test.create({
      data: {
        title,
        description,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        passingScore: passingScore ? parseInt(passingScore) : 70,
        chapterId: parseInt(chapterId),
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
      message: "Test created successfully",
      data: test,
    });
  } catch (error) {
    console.error("Error creating test:", error);
    res.status(500).json({ message: "Error creating test" });
  }
};

// Update a test
export const updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      timeLimit,
      passingScore,
      questions,
      isPublished,
    } = req.body;
    console.log(req.body);
    // First, verify the test exists
    const existingTest = await prisma.test.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingTest) {
      return res.status(404).json({ message: "Test not found" });
    }

    // Delete existing questions and options
    // await prisma.question.deleteMany({
    //   where: { testId: parseInt(id) },
    // });

    // Update the test with new questions and options
    const updatedTest = await prisma.test.update({
      where: { id: parseInt(id) },
      data: {
        title,
        description,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        passingScore: passingScore ? parseInt(passingScore) : 70,
        isPublished: isPublished,
        // questions: {
        //   create: questions.map((q) => ({
        //     question: q.question,
        //     type: q.type,
        //     points: q.points || 1,
        //     options: {
        //       create: q.options.map((opt) => ({
        //         content: opt.content,
        //         isCorrect: opt.isCorrect,
        //       })),
        //     },
        //   })),
        // },
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
      message: "Test updated successfully",
      data: updatedTest,
    });
  } catch (error) {
    console.error("Error updating test:", error);
    res.status(500).json({ message: "Error updating test" });
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
      return res.status(404).json({ message: "Test not found" });
    }

    await prisma.test.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Test deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting test:", error);
    res.status(500).json({ message: "Error deleting test" });
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
      return res.status(404).json({ message: "Test not found" });
    }

    const updatedTest = await prisma.test.update({
      where: { id: parseInt(id) },
      data: {
        isPublished: !test.isPublished,
      },
    });

    res.json({
      success: true,
      message: "Test publish status updated successfully",
      data: updatedTest,
    });
  } catch (error) {
    console.error("Error toggling test publish status:", error);
    res.status(500).json({ message: "Error updating test" });
  }
};
