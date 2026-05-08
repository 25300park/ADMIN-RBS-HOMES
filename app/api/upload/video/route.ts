import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth-options";

const s3Client = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
  },
});

// 허용되는 동영상 파일 타입
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo', // .avi
  'video/x-ms-wmv',  // .wmv
  'video/webm'
];

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'User is not authenticated' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 파일 타입 검증
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Video type not allowed. Supported formats: MP4, MPEG, MOV, AVI, WMV, WebM' 
      }, { status: 400 });
    }

    // 파일 크기 제한 (100MB)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json({ error: 'Video file size too large (max 100MB)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:\-T.]/g, '');
    const fileName = `${timestamp}_${file.name}`;

    const uploadParams = {
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
      Key: `${userId}/videos/${fileName}`, // 비디오 폴더
      Body: buffer,
      ContentType: file.type,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
    
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${uploadParams.Key}`;

    return NextResponse.json({ url, filename: file.name }, { status: 200 });
  } catch (error) {
    console.error('Video upload failed:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}