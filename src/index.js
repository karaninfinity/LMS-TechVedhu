import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.route.js";
import courseRoutes from "./routes/course.routes.js";
import mediaRoutes from "./routes/media.routes.js";
import testAttemptRoutes from "./routes/TestAttempt.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import questionRoutes from "./routes/question.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import messageRoutes from "./routes/message.routes.js";
import { Server } from "socket.io";
import http from "http";
import { MessageType } from "@prisma/client";
import prisma from "../config/prisma.js";

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("join_room", ({ id }) => {
    console.log(`user ${id} joined room ${socket.id}`);
    socket.join(id);
  });
  socket.on(
    "send_message",
    async ({
      message,
      sender_id,
      receiver_id = null,
      files = [],
      reply_to = null,
      message_type = MessageType.TEXT,
    }) => {
      if (files.length > 0) {
        files.forEach(async (file) => {
          const response = await prisma.messages.create({
            data: {
              text: message,
              sender_id: sender_id,
              receiver_id: receiver_id,
              message_type: MessageType.MEDIA,
              media_url: file.path,
              media_type: file.type,
              reply_to: reply_to,
            },
            include: {
              sender: true,
              receiver: true,
              reply: {
                include: {
                  sender: true,
                },
              },
            },
          });
          io.emit("receive_message", response);
        });
        return;
      }
      const response = await prisma.messages.create({
        data: {
          text: message,
          sender_id: sender_id,
          receiver_id: receiver_id,
          message_type: message_type,
          reply_to: reply_to,
        },
        include: {
          sender: true,
          receiver: true,
          reply: {
            include: {
              sender: true,
            },
          },
        },
      });
      io.emit("receive_message", response);
    }
  );

  socket.on("delete_message", async ({ message_id }) => {
    const response = await prisma.messages.delete({
      where: {
        id: message_id,
      },
    });
    io.emit("delete_message", response);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allow cross-origin resource sharing for media files
  })
);
app.use(morgan("dev"));

// Serve static files with proper CORS headers
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, path) => {
      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      res.set("Access-Control-Allow-Origin", "*");
    },
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/tests", testAttemptRoutes);
app.use("/api/enroll", enrollmentRoutes);
app.use("/api/tests/:testId/questions", questionRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/messages", messageRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Graceful shutdown
// process.on("SIGTERM", async () => {
//   console.log("SIGTERM received. Closing HTTP server and Prisma Client...");
//   await prisma.$disconnect();
//   process.exit(0);
// });

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the LMS API" });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
