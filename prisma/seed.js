import pkg from "@prisma/client";
const { PrismaClient, Role, Status, QuestionType, AttachmentType } = pkg;
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.upsert({
      where: { email: "admin@lms.com" },
      update: {},
      create: {
        email: "admin@lms.com",
        password: adminPassword,
        firstName: "Admin",
        lastName: "User",
        role: Role.ADMIN,
        status: Status.ACTIVE,
      },
    });
    console.log("Created admin user:", admin.email);

    // Create instructor user
    const instructorPassword = await bcrypt.hash("instructor123", 10);
    const instructor = await prisma.user.upsert({
      where: { email: "instructor@lms.com" },
      update: {},
      create: {
        email: "instructor@lms.com",
        password: instructorPassword,
        firstName: "John",
        lastName: "Doe",
        role: Role.INSTRUCTOR,
        status: Status.ACTIVE,
      },
    });
    console.log("Created instructor:", instructor.email);

    // Create student users
    const studentPassword = await bcrypt.hash("student123", 10);
    const students = await Promise.all([
      prisma.user.upsert({
        where: { email: "student1@lms.com" },
        update: {},
        create: {
          email: "student1@lms.com",
          password: studentPassword,
          firstName: "Alice",
          lastName: "Smith",
          role: Role.STUDENT,
          status: Status.ACTIVE,
        },
      }),
      prisma.user.upsert({
        where: { email: "student2@lms.com" },
        update: {},
        create: {
          email: "student2@lms.com",
          password: studentPassword,
          firstName: "Bob",
          lastName: "Johnson",
          role: Role.STUDENT,
          status: Status.ACTIVE,
        },
      }),
    ]);
    console.log("Created students:", students.map((s) => s.email).join(", "));

    // Create sample course with chapters, lessons, and tests
    const course = await prisma.course.upsert({
      where: {
        id: 1,
      },
      update: {},
      create: {
        title: "Introduction to Web Development",
        description:
          "Learn the basics of web development including HTML, CSS, and JavaScript",
        coverImage: "https://example.com/images/web-dev-cover.jpg",
        instructorId: instructor.id,
        isPublished: true,
        chapters: {
          create: [
            {
              title: "Getting Started with HTML",
              description: "Learn the fundamentals of HTML",
              position: 1,
              isPublished: true,
              lessons: {
                create: [
                  {
                    title: "HTML Basics",
                    content:
                      "HTML (HyperText Markup Language) is the standard markup language for creating web pages.",
                    videoUrl: "https://example.com/videos/html-basics.mp4",
                    position: 1,
                    isPublished: true,
                    attachments: {
                      create: [
                        {
                          name: "HTML Cheat Sheet",
                          url: "https://example.com/docs/html-cheatsheet.pdf",
                          type: AttachmentType.DOCUMENT,
                        },
                        {
                          name: "HTML Structure Diagram",
                          url: "https://example.com/images/html-structure.png",
                          type: AttachmentType.IMAGE,
                        },
                      ],
                    },
                  },
                  {
                    title: "HTML Forms",
                    content: "Learn how to create interactive forms in HTML.",
                    videoUrl: "https://example.com/videos/html-forms.mp4",
                    position: 2,
                    isPublished: true,
                    attachments: {
                      create: [
                        {
                          name: "Forms Tutorial",
                          url: "https://example.com/videos/forms-tutorial.mp4",
                          type: AttachmentType.VIDEO,
                        },
                      ],
                    },
                  },
                ],
              },
              tests: {
                create: [
                  {
                    title: "HTML Basics Quiz",
                    description: "Test your knowledge of HTML basics",
                    timeLimit: 30,
                    passingScore: 80,
                    isPublished: true,
                    questions: {
                      create: [
                        {
                          question: "What does HTML stand for?",
                          type: QuestionType.SINGLE_CHOICE,
                          points: 2,
                          options: {
                            create: [
                              {
                                content: "HyperText Markup Language",
                                isCorrect: true,
                              },
                              {
                                content: "High-Level Text Language",
                                isCorrect: false,
                              },
                              {
                                content: "HyperTransfer Markup Language",
                                isCorrect: false,
                              },
                            ],
                          },
                        },
                        {
                          question:
                            "Which tags are used to define an HTML form?",
                          type: QuestionType.MULTIPLE_CHOICE,
                          points: 2,
                          options: {
                            create: [
                              {
                                content: "<form>",
                                isCorrect: true,
                              },
                              {
                                content: "<input>",
                                isCorrect: true,
                              },
                              {
                                content: "<section>",
                                isCorrect: false,
                              },
                              {
                                content: "<button>",
                                isCorrect: true,
                              },
                            ],
                          },
                        },
                        {
                          question: "HTML is a programming language.",
                          type: QuestionType.TRUE_FALSE,
                          points: 1,
                          options: {
                            create: [
                              {
                                content: "True",
                                isCorrect: false,
                              },
                              {
                                content: "False",
                                isCorrect: true,
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              title: "CSS Fundamentals",
              description: "Master the basics of CSS styling",
              position: 2,
              isPublished: true,
              lessons: {
                create: [
                  {
                    title: "CSS Selectors",
                    content:
                      "Learn about different types of CSS selectors and their specificity.",
                    videoUrl: "https://example.com/videos/css-selectors.mp4",
                    position: 1,
                    isPublished: true,
                    attachments: {
                      create: [
                        {
                          name: "CSS Selectors Reference",
                          url: "https://example.com/docs/css-selectors.pdf",
                          type: AttachmentType.DOCUMENT,
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
    console.log(
      "Created course with chapters, lessons, and tests:",
      course.title
    );

    // Create sample enrollments
    const enrollments = await Promise.all([
      prisma.enrollment.create({
        data: {
          userId: students[0].id, // Alice
          courseId: course.id,
          status: "ENROLLED",
          progress: 25.0, // 25% progress
        },
      }),
      prisma.enrollment.create({
        data: {
          userId: students[1].id, // Bob
          courseId: course.id,
          status: "ENROLLED",
          progress: 15.0, // 15% progress
        },
      }),
    ]);
    console.log("Created enrollments for students:", enrollments.length);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
