import { db } from '@/lib/db';
import { notifications, activityLogs } from '@/lib/db/schema';

interface CreateNotificationData {
  userId: string;
  type: 'request_created' | 'request_updated' | 'request_assigned' | 'note_added' | 'status_changed' | 'due_date_reminder' | 'user_created' | 'company_created';
  title: string;
  message: string;
  metadata?: string;
}

interface CreateActivityLogData {
  userId: string;
  companyId?: string;
  type: 'request_created' | 'request_updated' | 'request_assigned' | 'note_added' | 'attachment_uploaded' | 'status_changed' | 'user_created' | 'user_updated' | 'company_updated';
  description: string;
  requestId?: string;
  metadata?: string;
}

export const notificationService = {
  async createNotification(data: CreateNotificationData) {
    try {
      await db.insert(notifications).values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata,
        read: false,
      });
    } catch {}
  },

  async createActivityLog(data: CreateActivityLogData) {
    try {
      await db.insert(activityLogs).values({
        type: data.type,
        description: data.description,
        userId: data.userId,
        companyId: data.companyId,
        requestId: data.requestId,
        metadata: data.metadata,
      });
    } catch {}
  },

  async notifyUserCreated(adminUserId: string, newUser: { id: string; firstName: string; lastName: string; email: string; companyId?: string }) {
    await this.createNotification({
      userId: adminUserId,
      type: 'user_created',
      title: 'New User Created',
      message: `User ${newUser.firstName} ${newUser.lastName} has been created successfully`,
      metadata: JSON.stringify({ userId: newUser.id, userType: 'user' }),
    });

    await this.createActivityLog({
      userId: adminUserId,
      companyId: newUser.companyId,
      type: 'user_created',
      description: `Created new user: ${newUser.firstName} ${newUser.lastName} (${newUser.email})`,
      metadata: JSON.stringify({ userId: newUser.id }),
    });
  },

  async notifyCustomerDetailsUpdated(adminUserId: string, customerId: string, customerName: string) {
    await this.createNotification({
      userId: adminUserId,
      type: 'company_created',
      title: 'Customer Details Updated',
      message: `Customer details for ${customerName} have been updated successfully`,
      metadata: JSON.stringify({ companyId: customerId, entityType: 'company' }),
    });

    await this.createActivityLog({
      userId: adminUserId,
      companyId: customerId,
      type: 'company_updated',
      description: `Updated customer details for: ${customerName}`,
      metadata: JSON.stringify({ companyId: customerId }),
    });
  },
};
