import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { companies, users, serviceRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { generateCompanyCode } from '@/lib/auth/utils-node';
import { emailService } from '@/lib/email/sendgrid';

const createCustomerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  primaryContact: z.string().min(1, 'Primary contact is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address'),
});

const deleteCustomerSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
});

export const GET = requireRole(['super_admin'])(
  async () => {
    try {
      const customersWithUsers = await db.query.companies.findMany({
        with: {
          users: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
        orderBy: (companies, { asc }) => [asc(companies.companyName)],
      });

      return NextResponse.json({ customers: customersWithUsers });
    } catch (error) {
      console.error('Failed to fetch customers for management:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const POST = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validatedData = createCustomerSchema.parse(body);

      // Check if company with this email already exists
      const existingCompany = await db.query.companies.findFirst({
        where: eq(companies.email, validatedData.email),
      });

      if (existingCompany) {
        return NextResponse.json(
          { error: 'A company with this email already exists' },
          { status: 400 }
        );
      }

      // Generate unique company code
      let companyCode = generateCompanyCode();
      let codeExists = true;
      let attempts = 0;
      const maxAttempts = 10;
      
      // Ensure the generated code is unique (with safety limit)
      while (codeExists && attempts < maxAttempts) {
        const existingCode = await db.query.companies.findFirst({
          where: eq(companies.companyCode, companyCode),
        });
        
        if (!existingCode) {
          codeExists = false;
        } else {
          companyCode = generateCompanyCode();
          attempts++;
        }
      }

      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: 'Unable to generate unique company code. Please try again.' },
          { status: 500 }
        );
      }

      // Create the new company with the generated code
      const [newCompany] = await db.insert(companies).values({
        companyName: validatedData.companyName,
        companyCode: companyCode,
        primaryContact: validatedData.primaryContact,
        phone: validatedData.phone || '',
        email: validatedData.email,
      }).returning();

      // Send the company code via email (async, don't wait for completion)
      const sendEmailPromise = emailService.sendCompanyCode(validatedData.email, {
        companyName: validatedData.companyName,
        primaryContact: validatedData.primaryContact,
        companyCode: companyCode,
      }).catch(emailError => {
        console.error('Failed to send company code email:', emailError);
        // Email failure doesn't affect the success of company creation
      });

      // Don't wait for email to complete, but log if it fails
      sendEmailPromise.then(() => {
        console.log(`Company code email sent successfully to ${validatedData.email}`);
      });

      // Fetch the customer with users for the response
      const customerWithUsers = await db.query.companies.findFirst({
        where: eq(companies.id, newCompany.id),
        with: {
          users: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      return NextResponse.json({ 
        success: true, 
        customer: customerWithUsers,
        companyCode: companyCode,
        message: `Company "${validatedData.companyName}" created successfully! Company code ${companyCode} has been sent to ${validatedData.email}.`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Failed to create customer:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const DELETE = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validatedData = deleteCustomerSchema.parse(body);
      const customerId = validatedData.customerId;

      // Check if customer exists
      const existingCustomer = await db.query.companies.findFirst({
        where: eq(companies.id, customerId),
      });

      if (!existingCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // Check if customer has active service requests
      const hasActiveRequests = await db.query.serviceRequests.findFirst({
        where: eq(serviceRequests.companyId, customerId),
      });

      if (hasActiveRequests) {
        return NextResponse.json(
          { error: 'Cannot delete customer with active service requests. Please close or transfer all service requests first.' },
          { status: 400 }
        );
      }

      // Delete all users associated with the company first
      await db.delete(users).where(eq(users.companyId, customerId));
      
      // Then delete the company
      await db.delete(companies).where(eq(companies.id, customerId));

      console.log(`Customer ${existingCustomer.companyName} (${existingCustomer.companyCode}) deleted successfully`);

      return NextResponse.json({ 
        success: true, 
        message: `Customer "${existingCustomer.companyName}" and all associated users have been deleted successfully.` 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Failed to delete customer:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);

export const PUT = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const updateCustomerSchema = z.object({
        customerId: z.string().min(1, 'Customer ID is required'),
        companyName: z.string().min(1, 'Company name is required').optional(),
        primaryContact: z.string().min(1, 'Primary contact is required').optional(),
        phone: z.string().optional(),
        email: z.string().email('Invalid email address').optional(),
      });

      const validatedData = updateCustomerSchema.parse(body);
      const { customerId, ...updateData } = validatedData;

      // Check if customer exists
      const existingCustomer = await db.query.companies.findFirst({
        where: eq(companies.id, customerId),
      });

      if (!existingCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }

      // If email is being updated, check if new email already exists
      if (updateData.email && updateData.email !== existingCustomer.email) {
        const emailExists = await db.query.companies.findFirst({
          where: eq(companies.email, updateData.email),
        });

        if (emailExists) {
          return NextResponse.json(
            { error: 'A company with this email already exists' },
            { status: 400 }
          );
        }
      }

      // Update the company
      const [updatedCompany] = await db.update(companies)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, customerId))
        .returning();

      // Fetch the updated customer with users
      const customerWithUsers = await db.query.companies.findFirst({
        where: eq(companies.id, customerId),
        with: {
          users: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      });

      console.log(`Customer ${updatedCompany.companyName} (${updatedCompany.companyCode}) updated successfully`);

      return NextResponse.json({ 
        success: true, 
        customer: customerWithUsers,
        message: `Customer "${updatedCompany.companyName}" updated successfully.`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Failed to update customer:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);