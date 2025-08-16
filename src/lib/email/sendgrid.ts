import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: EmailTemplate) {
  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
  } catch (error) {
    throw error;
  }
}

export const emailTemplates = {
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
  noteAdded: (requestId: string, noteContent: string, authorName: string) => ({
    subject: `New Note Added to Request ${requestId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Note Added</h2>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Added by:</strong> ${authorName}</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Note:</strong></p>
          <p>${noteContent}</p>
        </div>
        <p>Please login to the Service Queue platform to view the full request details.</p>
      </div>
    `,
  }),
  requestStatusUpdate: (requestId: string, oldStatus: string, newStatus: string, updatedBy: string) => ({
    subject: `Request ${requestId} Status Updated`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Request Status Updated</h2>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Status changed from:</strong> <span style="text-transform: capitalize;">${oldStatus}</span></p>
        <p><strong>Status changed to:</strong> <span style="text-transform: capitalize; color: #28a745;">${newStatus}</span></p>
        <p><strong>Updated by:</strong> ${updatedBy}</p>
        <p>Please login to the Service Queue platform to view the full request details.</p>
      </div>
    `,
  }),
};