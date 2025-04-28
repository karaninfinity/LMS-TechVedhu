import prisma from "../../config/prisma.js";

// Start a test attempt
export const startTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id; // Assuming user is authenticated

    // Check if user has already attempted this test
    const existingAttempt = await prisma.testAttempt.findUnique({
      where: {
        userId_testId: {
          userId,
          testId: parseInt(testId),
        },
      },
    });

    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message: "You have already attempted this test",
      });
    }

    // Create new test attempt
    const attempt = await prisma.testAttempt.create({
      data: {
        userId,
        testId: parseInt(testId),
        score: 0,
        answers: {},
      },
      include: {
        test: {
          include: {
            questions: {
              include: {
                options: {
                  select: {
                    id: true,
                    content: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Remove correct answers from response
    const testWithoutAnswers = {
      ...attempt.test,
      questions: attempt.test.questions.map((q) => ({
        ...q,
        options: q.options.map((o) => ({
          id: o.id,
          content: o.content,
        })),
      })),
    };

    res.json({
      success: true,
      message: "Test started successfully",
      data: {
        attemptId: attempt.id,
        test: testWithoutAnswers,
      },
    });
  } catch (error) {
    console.error("Error starting test:", error);
    res.status(500).json({ message: "Error starting test" });
  }
};

// Submit test answers
export const submitTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id; // Assuming user is authenticated
    const { answers } = req.body; // { questionId: [optionIds] }

    // Get the test attempt
    const attempt = await prisma.testAttempt.findUnique({
      where: {
        userId_testId: {
          userId,
          testId: parseInt(testId),
        },
      },
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Test attempt not found",
      });
    }

    // Get test questions and correct answers
    const test = await prisma.test.findUnique({
      where: { id: parseInt(testId) },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;

    test.questions.forEach((question) => {
      const userAnswer = answers[question.id] || [];
      const correctOptions = question.options
        .filter((o) => o.isCorrect)
        .map((o) => o.id);

      totalPoints += question.points;

      // Check if arrays are equal (for both single and multiple choice)
      const isCorrect =
        userAnswer.length === correctOptions.length &&
        userAnswer.every((id) => correctOptions.includes(id));

      if (isCorrect) {
        earnedPoints += question.points;
      }
    });

    const finalScore = (earnedPoints / totalPoints) * 100;

    // Update test attempt with answers and score
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        answers,
        score: finalScore,
      },
    });

    res.json({
      success: true,
      message: "Test submitted successfully",
      data: {
        score: finalScore,
        passed: finalScore >= test.passingScore,
      },
    });
  } catch (error) {
    console.error("Error submitting test:", error);
    res.status(500).json({ message: "Error submitting test" });
  }
};

// Get test report
export const getTestReport = async (req, res) => {
  try {
    const { testId } = req.params;
    const userId = req.user.id; // Assuming user is authenticated

    const attempt = await prisma.testAttempt.findUnique({
      where: {
        userId_testId: {
          userId,
          testId: parseInt(testId),
        },
      },
      include: {
        test: {
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

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Test attempt not found",
      });
    }

    // Format report with detailed feedback
    const report = {
      score: attempt.score,
      passed: attempt.score >= attempt.test.passingScore,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      questions: attempt.test.questions.map((question) => {
        const userAnswer = attempt.answers[question.id] || [];
        const correctOptions = question.options
          .filter((o) => o.isCorrect)
          .map((o) => o.id);

        return {
          question: question.question,
          points: question.points,
          userAnswer: question.options
            .filter((o) => userAnswer.includes(o.id))
            .map((o) => o.content),
          correctAnswer: question.options
            .filter((o) => correctOptions.includes(o.id))
            .map((o) => o.content),
          isCorrect:
            userAnswer.length === correctOptions.length &&
            userAnswer.every((id) => correctOptions.includes(id)),
        };
      }),
    };

    res.json({
      success: true,
      message: "Test report retrieved successfully",
      data: report,
    });
  } catch (error) {
    console.error("Error getting test report:", error);
    res.status(500).json({ message: "Error getting test report" });
  }
};
