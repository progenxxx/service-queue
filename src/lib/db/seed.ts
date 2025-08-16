import "dotenv/config";
import { db } from './index';
import { users, companies } from './schema';
import { hashPassword } from '../auth/utils';
import { emailService } from '../email/sendgrid';

async function seed() {
  try {
    const [company] = await db.insert(companies).values({
      companyName: 'Community Insurance Center',
      primaryContact: 'Mark Ranny Aglapay',
      email: 'aglapay.markranny@gmail.com',
      phone: '09262214228',
    }).returning();

    const adminPassword = 'Admin123!';
    const hashedPassword = await hashPassword(adminPassword);

    const [adminUser] = await db.insert(users).values({
      firstName: 'Mark Ranny',
      lastName: 'Aglapay',
      email: 'aglapay.markranny@gmail.com',
      passwordHash: hashedPassword,
      role: 'super_admin',
      companyId: company.id,
      isActive: true,
    }).returning();

    try {
      await emailService.sendAdminCredentials(adminUser.email, {
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        password: adminPassword,
        companyName: company.companyName,
      });
    } catch (emailError) {
    }

  } catch (error) {
    throw error;
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      process.exit(1);
    });
}

export default seed;