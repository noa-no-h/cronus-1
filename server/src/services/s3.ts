import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1', // Or your bucket's region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'whatdidyougetdonetoday';

export const generateUploadUrl = async (userId: string, fileType: string = 'image/jpeg') => {
  const key = `screenshots/${userId}/${uuidv4()}.jpg`; // Or .png, etc.

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    // ACL: 'public-read', // Optional: if you want the files to be publicly readable by default
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // URL expires in 5 minutes
    return { uploadUrl: signedUrl, key };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Could not generate upload URL');
  }
};

export const getPublicUrl = (key: string) => {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};
