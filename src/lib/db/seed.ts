import "dotenv/config";
import { db } from './index';
import { users, companies, agents } from './schema';
import { hashPassword, generateLoginCode } from '../auth/utils';
import { emailService } from '../email/sendgrid';

async function seed() {
  try {
    const [axsCompany] = await db.insert(companies).values({
      companyName: 'AXS Insurance Services',
      primaryContact: 'Mark Ranny Aglapay',
      email: 'aglapay.markranny@gmail.com',
      phone: '09262214228',
    }).returning();

    const [cicCompany] = await db.insert(companies).values({
      companyName: 'Community Insurance Center',
      primaryContact: 'John Smith',
      email: 'john.smith@communityinscenter.net',
      phone: '555-0123',
    }).returning();

    // Super Admin
    const adminPassword = 'Admin123!';
    const hashedAdminPassword = await hashPassword(adminPassword);

    const [superAdmin] = await db.insert(users).values({
      firstName: 'Mark Ranny',
      lastName: 'Aglapay',
      email: 'aglapay.markranny@gmail.com',
      passwordHash: hashedAdminPassword,
      role: 'super_admin',
      companyId: axsCompany.id,
      isActive: true,
    }).returning();

    // Agent
    const agentLoginCode = generateLoginCode();

    const [agent] = await db.insert(users).values({
      firstName: 'Ancheta',
      lastName: 'BW',
      email: 'bw.ancheta@ecticketph.com',
      loginCode: agentLoginCode,
      role: 'agent',
      companyId: axsCompany.id,
      isActive: true,
    }).returning();

    await db.insert(agents).values([
      {
        userId: agent.id,
        assignedCompanyIds: [cicCompany.id],
        isActive: true,
      },
    ]);

    // Customer Admin - uses email + login code
    const cicAdminLoginCode = generateLoginCode();

    const [customerAdmin] = await db.insert(users).values({
      firstName: 'John',
      lastName: 'Smith',
      email: 'spawn0731@gmail.com',
      loginCode: cicAdminLoginCode,
      role: 'customer_admin',
      companyId: cicCompany.id,
      isActive: true,
    }).returning();

    // Customer
    const customerLoginCode = generateLoginCode();

    const [customer] = await db.insert(users).values({
      firstName: 'Diana Mae',
      lastName: 'Nillo',
      email: 'dianamaenillo21@gmail.com',
      loginCode: customerLoginCode,
      role: 'customer',
      companyId: cicCompany.id,
      isActive: true,
    }).returning();

    try {
      await emailService.sendAdminCredentials(superAdmin.email, {
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        email: superAdmin.email,
        password: adminPassword,
        companyName: axsCompany.companyName,
      });

      await emailService.sendCustomerAdminWelcome(customerAdmin.email, {
        firstName: customerAdmin.firstName,
        lastName: customerAdmin.lastName,
        email: customerAdmin.email,
        loginCode: cicAdminLoginCode,
        companyName: cicCompany.companyName,
      });

      await emailService.sendAgentWelcome(agent.email, {
        firstName: agent.firstName,
        lastName: agent.lastName,
        loginCode: agentLoginCode,
        companyName: axsCompany.companyName,
      });

      await emailService.sendCustomerWelcome(customer.email, {
        firstName: customer.firstName,
        lastName: customer.lastName,
        loginCode: customerLoginCode,
        companyName: cicCompany.companyName,
      });

    } catch {
      // Email sending failed, but continue with seeding
    }

  } catch {
    // Seeding failed
    throw new Error('Seeding failed');
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch(() => {
      process.exit(1);
    });
}

export default seed;