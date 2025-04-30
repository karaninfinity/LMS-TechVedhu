import prisma from "../../config/prisma.js";

// Get all questions for a test
export const getQuestions = async (req, res) => {
  try {
    const { testId } = req.params;

    const questions = await prisma.question.findMany({
      where: {
        testId: parseInt(testId),
      },
      include: {
        options: true,
      },
      orderBy: {
        position: "asc",
      },
    });

    res.json({
      success: true,
      message: "Questions fetched successfully",
      data: questions,
    });
  } catch (error) {
    console.error("Error getting questions:", error);
    res.status(500).json({ message: "Error getting questions" });
  }
};

// Get a single question by ID
export const getQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id: parseInt(id) },
      include: {
        options: true,
      },
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({
      success: true,
      message: "Question fetched successfully",
      data: question,
    });
  } catch (error) {
    console.error("Error getting question:", error);
    res.status(500).json({ message: "Error getting question" });
  }
};

// Create a new question
export const createQuestion = async (req, res) => {
  try {
    const { testId } = req.params;
    const { question, type, points, options, position } = req.body;
    console.log(req.body);
    // If position is provided, shift existing questions
    if (position !== undefined) {
      await prisma.question.updateMany({
        where: {
          testId: parseInt(testId),
          position: {
            gte: position,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });
    }

    // Get the last position if no position is provided
    let finalPosition = position;
    if (finalPosition === undefined) {
      const lastQuestion = await prisma.question.findFirst({
        where: { testId: parseInt(testId) },
        orderBy: { position: "desc" },
      });
      finalPosition = lastQuestion ? lastQuestion.position + 1 : 0;
    }

    const newQuestion = await prisma.question.create({
      data: {
        question,
        type,
        points: points || 1,
        position: finalPosition,
        testId: parseInt(testId),
        options: {
          create: options.map((opt) => ({
            content: opt.content,
            isCorrect: opt.isCorrect,
            image: opt.image,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Question created successfully",
      data: newQuestion,
    });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ message: "Error creating question" });
  }
};

// Update a question
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, type, points, options, position } = req.body;
    console.log(req.body);
    // First, verify the question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Handle position update if provided and different from current
    if (position !== undefined && position !== existingQuestion.position) {
      // Update positions of other questions
      if (position > existingQuestion.position) {
        // Moving down: decrement positions of questions between old and new position
        await prisma.question.updateMany({
          where: {
            testId: existingQuestion.testId,
            position: {
              gt: existingQuestion.position,
              lte: position,
            },
          },
          data: {
            position: {
              decrement: 1,
            },
          },
        });
      } else {
        // Moving up: increment positions of questions between new and old position
        await prisma.question.updateMany({
          where: {
            testId: existingQuestion.testId,
            position: {
              gte: position,
              lt: existingQuestion.position,
            },
          },
          data: {
            position: {
              increment: 1,
            },
          },
        });
      }
    }

    // Delete existing options
    await prisma.option.deleteMany({
      where: { questionId: parseInt(id) },
    });

    // Update the question with new options
    const updatedQuestion = await prisma.question.update({
      where: { id: parseInt(id) },
      data: {
        question,
        type,
        points: points || 1,
        position: position !== undefined ? position : existingQuestion.position,
        options: {
          create: options.map((opt) => ({
            content: opt.content,
            isCorrect: opt.isCorrect,
            image: opt.image,
          })),
        },
      },
      include: {
        options: true,
      },
    });

    res.json({
      success: true,
      message: "Question updated successfully",
      data: updatedQuestion,
    });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Error updating question" });
  }
};

// Reorder questions
export const reorderQuestions = async (req, res) => {
  try {
    const { testId } = req.params;
    const { questions } = req.body; // Array of { id, position }

    await prisma.$transaction(
      questions.map(({ id, position }) =>
        prisma.question.update({
          where: { id: parseInt(id) },
          data: { position },
        })
      )
    );

    const updatedQuestions = await prisma.question.findMany({
      where: { testId: parseInt(testId) },
      orderBy: { position: "asc" },
      include: { options: true },
    });

    res.json({
      success: true,
      message: "Questions reordered successfully",
      data: updatedQuestions,
    });
  } catch (error) {
    console.error("Error reordering questions:", error);
    res.status(500).json({ message: "Error reordering questions" });
  }
};

// Delete a question
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.question.findUnique({
      where: { id: parseInt(id) },
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Update positions of subsequent questions
    await prisma.question.updateMany({
      where: {
        testId: question.testId,
        position: {
          gt: question.position,
        },
      },
      data: {
        position: {
          decrement: 1,
        },
      },
    });

    await prisma.question.delete({
      where: { id: parseInt(id) },
    });

    res.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Error deleting question" });
  }
};
