import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth'; 
import { authOptions } from '@/lib/auth-options';

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function POST(req: Request) {
  try {
    // 세션에서 유저 ID를 가져옴
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'User is not authenticated' }, { status: 401 });
    }
    const userId = session.user.id; // 

    const formData = await req.formData();
    const files = formData.getAll('files');

    const uploadPromises: Promise<void>[] = [];
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const arrayBuffer = await (file as File).arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 현재 날짜와 시간을 기반으로 파일명 생성
      const date = new Date();
      const timestamp = date.toISOString().replace(/[:\-T.]/g, '');
      const fileName = `${timestamp}_${file.name}`;

      const uploadParams = {
        Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
        Key: `banners/${userId}/${fileName}`, // 유저 ID 폴더에 파일 업로드
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
