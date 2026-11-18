import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/require-admin';

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function POST(req: Request) {
  try {
    const admin = await checkAdmin();
    if (!admin.ok) {
      return NextResponse.json(
        { error: admin.status === 401 ? 'User is not authenticated' : 'Forbidden' },
        { status: admin.status }
      );
    }
    const userId = admin.session.user.id;
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const uploadPromises: Promise<void>[] = [];
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const date = new Date();
      const timestamp = date.toISOString().replace(/[:\-T.]/g, '');
      const fileName = `${timestamp}_${file.name}`;
      const uploadParams = {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME as string,
        Key: `popups/${userId}/${fileName}`,
        Body: buffer,
        ContentType: file.type,
      };
      const command = new PutObjectCommand(uploadParams);
      const uploadPromise = s3Client.send(command)
        .then(() => {
          const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${uploadParams.Key}`;
          uploadedUrls.push(url);
        })
        .catch(error => {
          console.error(`Error uploading file ${file.name}:`, error);
        });
      uploadPromises.push(uploadPromise);
    }

    await Promise.all(uploadPromises);
    return NextResponse.json({ uploadedUrls }, { status: 200 });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
