import { Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { responseHelper } from "../../../utils/responseHelper";
import ContactMessage from "../models/ContactMessage.model";
import emailService from "../../../services/third-party/email/nodemailer.service";
import { generateContactEmailHTML, generateContactEmailText, ContactEmailData } from "../../../services/third-party/email/templates/contactTemplate";
import logger from "../../../config/logger";

// Get super admin email from environment or use default
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || "admin@remiwire.com";

export const sendContactMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    // Create contact message in database
    const contactMessage = new ContactMessage({
      name,
      email,
      subject,
      message,
    });

    await contactMessage.save();

    // Prepare email data
    const emailData: ContactEmailData = {
      name,
      email,
      subject,
      message,
      timestamp: contactMessage.createdAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      priority: contactMessage.priority,
    };

    // Send email to super admin
    try {
      await emailService.sendMail({
        to: SUPER_ADMIN_EMAIL,
        subject: `New Contact Message: ${subject}`,
        html: generateContactEmailHTML(emailData),
        text: generateContactEmailText(emailData),
      });

      logger.info(`Contact message sent to super admin: ${SUPER_ADMIN_EMAIL}`);
    } catch (emailError) {
      logger.error({
        message: "Failed to send contact email",
        error: emailError,
      });
      // Don't fail the request if email fails, just log it
    }

    // Send confirmation email to customer
    try {
      await emailService.sendMail({
        to: email,
        subject: "Thank you for contacting Remiwire",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Thank you for contacting Remiwire!</h2>
            <p>Dear ${name},</p>
            <p>We have received your message and will get back to you within 24 hours.</p>
            <p><strong>Your message:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
              <p><strong>Subject:</strong> ${subject}</p>
              <p><strong>Message:</strong></p>
              <p>${message}</p>
            </div>
            <p>Best regards,<br>The Remiwire Team</p>
          </div>
        `,
        text: `
Thank you for contacting Remiwire!

Dear ${name},

We have received your message and will get back to you within 24 hours.

Your message:
Subject: ${subject}
Message: ${message}

Best regards,
The Remiwire Team
        `,
      });

      logger.info(`Confirmation email sent to customer: ${email}`);
    } catch (emailError) {
      logger.error({
        message: "Failed to send confirmation email",
        error: emailError,
      });
      // Don't fail the request if email fails, just log it
    }

    return responseHelper.success(res, {
      messageId: String(contactMessage._id),
      status: contactMessage.status,
    }, "Message sent successfully");
  } catch (error: any) {
    console.log(error);
    logger.error("Error sending contact message:", error);
    return responseHelper.serverError(res, "Failed to send message");
  }
};

export const getContactMessages = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const messages = await ContactMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("repliedBy", "firstname lastname email")
      .lean();

    const total = await ContactMessage.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return responseHelper.success(res, {
      messages,
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }, "Contact messages retrieved successfully");
  } catch (error: any) {
    logger.error("Error retrieving contact messages:", error);
    return responseHelper.serverError(res, "Failed to retrieve messages");
  }
};

export const getContactMessageById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findById(id)
      .populate("repliedBy", "firstname lastname email")
      .lean();

    if (!message) {
      return responseHelper.notFound(res, "Contact message not found");
    }

    return responseHelper.success(res, message, "Contact message retrieved successfully");
  } catch (error: any) {
    logger.error("Error retrieving contact message:", error);
    return responseHelper.serverError(res, "Failed to retrieve message");
  }
};

export const updateContactMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, priority, adminNotes } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    // If status is being changed to "replied", set repliedAt and repliedBy
    if (status === "replied") {
      updateData.repliedAt = new Date();
      updateData.repliedBy = req.user?._id; // Assuming user ID is available in req.user
    }

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("repliedBy", "firstname lastname email");

    if (!message) {
      return responseHelper.notFound(res, "Contact message not found");
    }

    return responseHelper.success(res, message, "Contact message updated successfully");
  } catch (error: any) {
    logger.error("Error updating contact message:", error);
    return responseHelper.serverError(res, "Failed to update message");
  }
};

export const deleteContactMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const message = await ContactMessage.findByIdAndDelete(id);

    if (!message) {
      return responseHelper.notFound(res, "Contact message not found");
    }

    return responseHelper.success(res, "Contact message deleted successfully");
  } catch (error: any) {
    logger.error("Error deleting contact message:", error);
    return responseHelper.serverError(res, "Failed to delete message");
  }
};

export const getContactStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await ContactMessage.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityStats = await ContactMessage.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    const totalMessages = await ContactMessage.countDocuments();
    const newMessages = await ContactMessage.countDocuments({ status: "new" });
    const todayMessages = await ContactMessage.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    return responseHelper.success(res, {
      totalMessages,
      newMessages,
      todayMessages,
      statusBreakdown: stats,
      priorityBreakdown: priorityStats,
    }, "Contact statistics retrieved successfully");
  } catch (error: any) {
    logger.error("Error retrieving contact statistics:", error);
    return responseHelper.serverError(res, "Failed to retrieve statistics");
  }
};
