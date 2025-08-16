import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailTemplate {
  to: string;
  templateId: string;
  dynamicTemplateData: Record<string, any>;
  from?: string;
  subject?: string;
}

export interface BasicEmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail({ 
  to, 
  templateId, 
  dynamicTemplateData, 
  from 
}: EmailTemplate) {
  try {
    const msg = {
      to,
      from: from || process.env.SENDGRID_FROM_EMAIL!,
      templateId,
      dynamicTemplateData,
    };

    await sgMail.send(msg);
  } catch (error) {
    throw error;
  }
}

export async function sendBasicEmail({ 
  to, 
  subject, 
  html, 
  text, 
  from 
}: BasicEmailTemplate) {
  try {
    const msg = {
      to,
      from: from || process.env.SENDGRID_FROM_EMAIL!,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    };

    await sgMail.send(msg);
  } catch (error) {
    throw error;
  }
}

export const emailService = {
  async sendCustomerWelcome(userEmail: string, userData: {
    firstName: string;
    lastName: string;
    loginCode: string;
    companyName: string;
  }) {
    return sendEmail({
      to: userEmail,
      templateId: process.env.SENDGRID_CUSTOMER_WELCOME_TEMPLATE_ID!,
      dynamicTemplateData: {
        ...userData,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      }
    });
  },

  async sendAgentWelcome(userEmail: string, userData: {
    firstName: string;
    lastName: string;
    loginCode: string;
    companyName: string;
  }) {
    return sendEmail({
      to: userEmail,
      templateId: process.env.SENDGRID_AGENT_WELCOME_TEMPLATE_ID!,
      dynamicTemplateData: {
        ...userData,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      }
    });
  },

  async sendAdminCredentials(userEmail: string, userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    companyName: string;
  }) {
    return sendEmail({
      to: userEmail,
      templateId: process.env.SENDGRID_ADMIN_WELCOME_TEMPLATE_ID!,
      dynamicTemplateData: {
        ...userData,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      }
    });
  },

  async sendNoteAdded(userEmail: string, noteData: {
    requestId: string;
    serviceQueueId: string;
    noteContent: string;
    authorName: string;
    clientName: string;
    requestTitle: string;
  }) {
    return sendEmail({
      to: userEmail,
      templateId: process.env.SENDGRID_NOTE_ADDED_TEMPLATE_ID!,
      dynamicTemplateData: {
        ...noteData,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        requestUrl: `${process.env.NEXT_PUBLIC_APP_URL}/requests/${noteData.requestId}`,
      }
    });
  },

  async sendStatusUpdate(userEmail: string, statusData: {
    requestId: string;
    serviceQueueId: string;
    oldStatus: string;
    newStatus: string;
    updatedBy: string;
    clientName: string;
    requestTitle: string;
  }) {
    return sendEmail({
      to: userEmail,
      templateId: process.env.SENDGRID_STATUS_UPDATE_TEMPLATE_ID!,
      dynamicTemplateData: {
        ...statusData,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        requestUrl: `${process.env.NEXT_PUBLIC_APP_URL}/requests/${statusData.requestId}`,
      }
    });
  },

  async sendRequestAssigned(userEmail: string, assignmentData: {
    requestId: string;
    serviceQueueId: string;
    assignedTo: string;
    assignedBy: string;
    clientName: string;
    requestTitle: string;
    dueDate?: string;
  }) {
    return sendEmail({
      to: userEmail,
      templateId: process.env.SENDGRID_REQUEST_ASSIGNED_TEMPLATE_ID!,
      dynamicTemplateData: {
        ...assignmentData,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        requestUrl: `${process.env.NEXT_PUBLIC_APP_URL}/requests/${assignmentData.requestId}`,
      }
    });
  },

  async sendNewRequest(userEmail: string, requestData: {
    requestId: string;
    serviceQueueId: string;
    clientName: string;
    requestTitle: string;
    category: string;
    createdBy: string;
    priority: string;
  }) {
    return sendEmail({
      to: userEmail,
      templateId: process.env.SENDGRID_NEW_REQUEST_TEMPLATE_ID!,
      dynamicTemplateData: {
        ...requestData,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        requestUrl: `${process.env.NEXT_PUBLIC_APP_URL}/requests/${requestData.requestId}`,
      }
    });
  },

  async sendPasswordReset(userEmail: string, resetData: {
    firstName: string;
    lastName: string;
    resetToken: string;
    expirationTime: string;
  }) {
    return sendEmail({
      to: userEmail,
      templateId: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID!,
      dynamicTemplateData: {
        ...resetData,
        resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetData.resetToken}`,
      }
    });
  },

  async sendDueDateReminder(userEmail: string, reminderData: {
    requestId: string;
    serviceQueueId: string;
    clientName: string;
    requestTitle: string;
    dueDate: string;
    assignedTo: string;
    daysUntilDue: number;
  }) {
    return sendEmail({
      to: userEmail,
      templateId: process.env.SENDGRID_DUE_DATE_REMINDER_TEMPLATE_ID!,
      dynamicTemplateData: {
        ...reminderData,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        requestUrl: `${process.env.NEXT_PUBLIC_APP_URL}/requests/${reminderData.requestId}`,
      }
    });
  }
};

export const legacyEmailTemplates = {
  welcomeCustomer: (loginCode: string) => ({
    subject: 'Welcome to Service Queue - Your Login Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Service Queue</h2>
        <p>Your login code is: <strong style="font-size: 18px; color: #007bff;">${loginCode}</strong></p>
        <p>Please use this code to access the Service Queue platform.</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    `,
  }),

  welcomeAgent: (loginCode: string) => ({
    subject: 'Service Queue Agent Access - Your Login Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Service Queue Agent Access</h2>
        <p>Your agent login code is: <strong style="font-size: 18px; color: #007bff;">${loginCode}</strong></p>
        <p>Please use this code to access the Service Queue platform.</p>
        <p>If you have any questions, please contact the administrator.</p>
      </div>
    `,
  }),

  adminCredentials: (email: string, password: string) => ({
    subject: 'Service Queue Admin Access - Your Credentials',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Service Queue Admin Access</h2>
        <p>Your admin credentials are:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> <span style="font-size: 16px; color: #007bff;">${password}</span></p>
        <p>Please login and change your password immediately for security.</p>
      </div>
    `,
  }),
};