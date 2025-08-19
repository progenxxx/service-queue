import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { generateCompanyCode } from '@/lib/auth/utils-node';
import { emailService } from '@/lib/email/sendgrid';

const resetCodeSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
});

export const POST = requireRole(['super_admin'])(
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const validatedData = resetCodeSchema.parse(body);
      const { customerId } = validatedData;

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

      // Generate new unique company code
      let newCompanyCode = generateCompanyCode();
      let codeExists = true;
      let attempts = 0;
      const maxAttempts = 10;
      
      // Ensure the generated code is unique (with safety limit)
      while (codeExists && attempts < maxAttempts) {
        const existingCode = await db.query.companies.findFirst({
          where: eq(companies.companyCode, newCompanyCode),
        });
        
        if (!existingCode) {
          codeExists = false;
        } else {
          newCompanyCode = generateCompanyCode();
          attempts++;
        }
      }

      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: 'Unable to generate unique company code. Please try again.' },
          { status: 500 }
        );
      }

      // Store the old code for reference
      const oldCompanyCode = existingCustomer.companyCode;

      // Update the company with the new code
      await db.update(companies)
        .set({
          companyCode: newCompanyCode,
          updatedAt: new Date(),
        })
        .where(eq(companies.id, customerId))
        .returning();

      // Send the new company code via email (async, don't wait for completion)
      const sendEmailPromise = emailService.sendCompanyCodeReset(existingCustomer.email, {
        companyName: existingCustomer.companyName,
        primaryContact: existingCustomer.primaryContact,
        oldCompanyCode: oldCompanyCode,
        newCompanyCode: newCompanyCode,
      }).catch(emailError => {
        console.error('Failed to send company code reset email:', emailError);
        // Email failure doesn't affect the success of code reset
      });

      // Don't wait for email to complete, but log if it succeeds
      sendEmailPromise.then(() => {
        console.log(`Company code reset email sent successfully to ${existingCustomer.email}`);
      });

      console.log(`Company code reset for ${existingCustomer.companyName}: ${oldCompanyCode} → ${newCompanyCode}`);

      return NextResponse.json({ 
        success: true, 
        newCompanyCode: newCompanyCode,
        oldCompanyCode: oldCompanyCode,
        message: `Company code for "${existingCustomer.companyName}" has been reset successfully! New code ${newCompanyCode} has been sent to ${existingCustomer.email}.`
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.issues },
          { status: 400 }
        );
      }

      console.error('Failed to reset company code:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);