import prisma from "../../config/prisma.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { text, receiverId, mediaUrl, mediaType, messageType, replyTo } =
      req.body;
    const senderId = req.user.id;

    // Create message
    const message = await prisma.messages.create({
      data: {
        text,
        sender_id: senderId,
        receiver_id: parseInt(receiverId),
        media_url: mediaUrl,
        media_type: mediaType,
        message_type: messageType || "TEXT",
        reply_to: replyTo ? parseInt(replyTo) : null,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        reply: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error sending message",
    });
  }
};

// Get messages between two users
export const getMessages = async (req, res) => {
  try {
    const messages = await prisma.messages.findMany({
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        reply: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({
      success: false,
      message: "Error getting messages",
    });
  }
};

// Get user's conversations
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.messages.findMany({
      where: {
        OR: [{ sender_id: userId }, { receiver_id: userId }],
      },
      distinct: ["sender_id", "receiver_id"],
      orderBy: {
        created_at: "desc",
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    // Get the last message and unread count for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const otherId =
          conv.sender_id === userId ? conv.receiver_id : conv.sender_id;

        const [lastMessage, unreadCount] = await Promise.all([
          prisma.messages.findFirst({
            where: {
              OR: [
                { AND: [{ sender_id: userId }, { receiver_id: otherId }] },
                { AND: [{ sender_id: otherId }, { receiver_id: userId }] },
              ],
            },
            orderBy: {
              created_at: "desc",
            },
          }),
          prisma.messages.count({
            where: {
              sender_id: otherId,
              receiver_id: userId,
              is_read: false,
            },
          }),
        ]);

        return {
          otherUser: conv.sender_id === userId ? conv.receiver : conv.sender,
          lastMessage,
          unreadCount,
        };
      })
    );

    res.json({
      success: true,
      data: conversationsWithDetails,
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({
      success: false,
      message: "Error getting conversations",
    });
  }
};

// Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    await prisma.messages.update({
      where: { id: parseInt(messageId) },
      data: { is_read: true },
    });

    res.json({
      success: true,
      message: "Message marked as read",
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error marking message as read",
    });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    await prisma.messages.delete({
      where: { id: parseInt(messageId) },
    });

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Error deleting message",
    });
  }
};
