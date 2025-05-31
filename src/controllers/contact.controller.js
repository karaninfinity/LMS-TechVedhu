import prisma from "../../config/prisma.js";
import { mailOptions, transporter } from "../../utils/mail.js";

/**
 * Handle contact form submission
 * @route POST /api/contact
 * @access Public
 */
export const submitContactForm = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, message } = req.body;
    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Store contact form submission in database
    const contact = await prisma.contactSubmission.create({
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        message,
      },
    });

    // Fetch contact email from config
    const contactEmailConfig = await prisma.config.findFirst({
      where: {
        key: "contactEmail",
      },
    });

    const contactEmail =
      contactEmailConfig?.value || "contact@yourlearningportal.com";
    try {
      await transporter.sendMail({
        ...mailOptions,
        to: contactEmail,
        subject: "New Contact Form Submission",
        html: `
          <h2>New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phoneNumber || "Not provided"}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      });
    } catch (emailError) {
      console.error("Email notification failed:", emailError);
      // Continue execution even if email fails
    }

    return res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Error in contact form submission:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting the form",
    });
  }
};

export const getContacts = async (req, res) => {
  try {
    const contacts = await prisma.contactSubmission.findMany();
    return res.status(200).json({
      success: true,
      message: "Contacts fetched successfully",
      data: contacts,
    });
  } catch (error) {
    console.error("Error in getting contacts:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching contacts",
    });
  }
};
