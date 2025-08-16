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

    const [techlinkCompany] = await db.insert(companies).values({
      companyName: 'TechLink Solutions',
      primaryContact: 'Sarah Johnson',
      email: 'sarah.johnson@techlink.com',
      phone: '555-0456',
    }).returning();

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

    const agentLoginCode1 = generateLoginCode();
    const agentLoginCode2 = generateLoginCode();
    const agentLoginCode3 = generateLoginCode();

    const [agent1] = await db.insert(users).values({
      firstName: 'Michael',
      lastName: 'Rodriguez',
      email: 'michael.rodriguez@axsinsurance.com',
      loginCode: agentLoginCode1,
      role: 'agent',
      companyId: axsCompany.id,
      isActive: true,
    }).returning();

    const [agent2] = await db.insert(users).values({
      firstName: 'Jennifer',
      lastName: 'Chen',
      email: 'jennifer.chen@axsinsurance.com',
      loginCode: agentLoginCode2,
      role: 'agent',
      companyId: axsCompany.id,
      isActive: true,
    }).returning();

    const [agent3] = await db.insert(users).values({
      firstName: 'David',
      lastName: 'Thompson',
      email: 'david.thompson@axsinsurance.com',
      loginCode: agentLoginCode3,
      role: 'agent',
      companyId: axsCompany.id,
      isActive: true,
    }).returning();

    await db.insert(agents).values([
      {
        userId: agent1.id,
        assignedCompanyIds: [cicCompany.id, techlinkCompany.id],
        isActive: true,
      },
      {
        userId: agent2.id,
        assignedCompanyIds: [cicCompany.id],
        isActive: true,
      },
      {
        userId: agent3.id,
        assignedCompanyIds: [techlinkCompany.id],
        isActive: true,
      },
    ]);

    const cicAdminPassword = 'CICAdmin123!';
    const hashedCICAdminPassword = await hashPassword(cicAdminPassword);
    const cicUserLoginCode1 = generateLoginCode();
    const cicUserLoginCode2 = generateLoginCode();

    const [cicAdmin] = await db.insert(users).values({
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@communityinscenter.net',
      passwordHash: hashedCICAdminPassword,
      role: 'customer_admin',
      companyId: cicCompany.id,
      isActive: true,
    }).returning();

    const [cicUser1] = await db.insert(users).values({
      firstName: 'Lisa',
      lastName: 'Williams',
      email: 'lisa.williams@communityinscenter.net',
      loginCode: cicUserLoginCode1,
      role: 'customer',
      companyId: cicCompany.id,
      isActive: true,
    }).returning();

    const [cicUser2] = await db.insert(users).values({
      firstName: 'Robert',
      lastName: 'Davis',
      email: 'robert.davis@communityinscenter.net',
      loginCode: cicUserLoginCode2,
      role: 'customer',
      companyId: cicCompany.id,
      isActive: true,
    }).returning();

    const techlinkAdminPassword = 'TechAdmin123!';
    const hashedTechlinkAdminPassword = await hashPassword(techlinkAdminPassword);
    const techlinkUserLoginCode1 = generateLoginCode();
    const techlinkUserLoginCode2 = generateLoginCode();
    const techlinkUserLoginCode3 = generateLoginCode();

    const [techlinkAdmin] = await db.insert(users).values({
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@techlink.com',
      passwordHash: hashedTechlinkAdminPassword,
      role: 'customer_admin',
      companyId: techlinkCompany.id,
      isActive: true,
    }).returning();

    const [techlinkUser1] = await db.insert(users).values({
      firstName: 'Mark',
      lastName: 'Anderson',
      email: 'mark.anderson@techlink.com',
      loginCode: techlinkUserLoginCode1,
      role: 'customer',
      companyId: techlinkCompany.id,
      isActive: true,
    }).returning();

    const [techlinkUser2] = await db.insert(users).values({
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'emma.wilson@techlink.com',
      loginCode: techlinkUserLoginCode2,
      role: 'customer',
      companyId: techlinkCompany.id,
      isActive: true,
    }).returning();

    const [techlinkUser3] = await db.insert(users).values({
      firstName: 'James',
      lastName: 'Brown',
      email: 'james.brown@techlink.com',
      loginCode: techlinkUserLoginCode3,
      role: 'customer',
      companyId: techlinkCompany.id,
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

      await emailService.sendAdminCredentials(cicAdmin.email, {
        firstName: cicAdmin.firstName,
        lastName: cicAdmin.lastName,
        email: cicAdmin.email,
        password: cicAdminPassword,
        companyName: cicCompany.companyName,
      });

      await emailService.sendAdminCredentials(techlinkAdmin.email, {
        firstName: techlinkAdmin.firstName,
        lastName: techlinkAdmin.lastName,
        email: techlinkAdmin.email,
        password: techlinkAdminPassword,
        companyName: techlinkCompany.companyName,
      });

      await emailService.sendAgentWelcome(agent1.email, {
        firstName: agent1.firstName,
        lastName: agent1.lastName,
        loginCode: agentLoginCode1,
        companyName: axsCompany.companyName,
      });

      await emailService.sendAgentWelcome(agent2.email, {
        firstName: agent2.firstName,
        lastName: agent2.lastName,
        loginCode: agentLoginCode2,
        companyName: axsCompany.companyName,
      });

      await emailService.sendAgentWelcome(agent3.email, {
        firstName: agent3.firstName,
        lastName: agent3.lastName,
        loginCode: agentLoginCode3,
        companyName: axsCompany.companyName,
      });

      await emailService.sendCustomerWelcome(cicUser1.email, {
        firstName: cicUser1.firstName,
        lastName: cicUser1.lastName,
        loginCode: cicUserLoginCode1,
        companyName: cicCompany.companyName,
      });

      await emailService.sendCustomerWelcome(cicUser2.email, {
        firstName: cicUser2.firstName,
        lastName: cicUser2.lastName,
        loginCode: cicUserLoginCode2,
        companyName: cicCompany.companyName,
      });

      await emailService.sendCustomerWelcome(techlinkUser1.email, {
        firstName: techlinkUser1.firstName,
        lastName: techlinkUser1.lastName,
        loginCode: techlinkUserLoginCode1,
        companyName: techlinkCompany.companyName,
      });

      await emailService.sendCustomerWelcome(techlinkUser2.email, {
        firstName: techlinkUser2.firstName,
        lastName: techlinkUser2.lastName,
        loginCode: techlinkUserLoginCode2,
        companyName: techlinkCompany.companyName,
      });

      await emailService.sendCustomerWelcome(techlinkUser3.email, {
        firstName: techlinkUser3.firstName,
        lastName: techlinkUser3.lastName,
        loginCode: techlinkUserLoginCode3,
        companyName: techlinkCompany.companyName,
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