import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const GET = requireRole(['customer', 'customer_admin', 'agent', 'super_admin'])(
  async (req: NextRequest) => {
    try {
      const url = new URL(req.url);
      const requestId = url.searchParams.get('requestId');
      const fileName = url.searchParams.get('fileName');
      
      if (!requestId || !fileName) {
        return NextResponse.json({ error: 'Request ID and filename required' }, { status: 400 });
      }

      const filePath = join(process.cwd(), 'uploads', requestId, fileName);
      
      if (!existsSync(filePath)) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      const fileBuffer = await readFile(filePath);

      const mimeTypes: { [key: string]: string } = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.txt': 'text/plain',
      };

      const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
      const mimeType = mimeTypes[fileExtension] || 'application/octet-stream';

      const originalFileName = fileName.substring(fileName.indexOf('-') + 1);

      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${originalFileName}"`,
        },
      });
    } catch (error) {
      console.error('Failed to download file:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
);
