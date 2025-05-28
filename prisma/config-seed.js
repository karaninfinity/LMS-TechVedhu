import pkg from "@prisma/client";
import { fileURLToPath } from "url";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// Default configurations
const defaultConfigs = [
  {
    key: "projectName",
    value: "Learning Management System",
  },
  {
    key: "projectShortName",
    value: "LMS",
  },
  {
    key: "logo",
    value: "/uploads/default/logo.png",
  },
  {
    key: "favicon",
    value: "/uploads/default/favicon.ico",
  },
  {
    key: "contactEmail",
    value: "contact@yourlearningportal.com",
  },
  {
    key: "supportEmail",
    value: "support@yourlearningportal.com",
  },
  {
    key: "contactPhone",
    value: "+1234567890",
  },
  {
    key: "address",
    value: "123 Learning Street, Education City",
  },
  {
    key: "socialLinks",
    value: JSON.stringify({
      facebook: "https://facebook.com/lms",
      twitter: "https://twitter.com/lms",
      instagram: "https://instagram.com/lms",
      linkedin: "https://linkedin.com/company/lms",
    }),
  },
  {
    key: "mainColor",
    value: "#2563EB", // A nice blue color
  },
  {
    key: "secondaryColor",
    value: "#10B981", // A nice green color
  },
  {
    key: "accentColor",
    value: "#F59E0B", // A nice amber color
  },
  {
    key: "footerText",
    value: "© 2023 Learning Management System. All rights reserved.",
  },
];

async function seedConfigs() {
  console.log("🌱 Seeding default configurations...");

  try {
    for (const config of defaultConfigs) {
      await prisma.config.upsert({
        where: { key: config.key },
        update: { value: config.value },
        create: config,
      });
    }
    console.log("✅ Configurations seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding configurations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedConfigs().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

export { seedConfigs };
