import { PrismaClient, Role, Status } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
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
