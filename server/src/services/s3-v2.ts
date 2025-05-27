import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// AWS SDK v2 is used here due to persistent SignatureDoesNotMatch issues
// with AWS SDK v3's getSignedUrl for PUT requests when handling Content-Type
// and other headers from browser-based clients. SDK v2 provides more
// predictable behavior for this use case.

// Configure AWS SDK v2
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET || '',
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'whatdidyougetdonetoday';

export const generateUploadUrl = async (userId: string, fileType: string = 'image/jpeg') => {
  const key = `screenshots/${userId}/${uuidv4()}.jpg`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 3000,
    ContentType: fileType,
  };

  try {
    // Generate pre-signed URL using v2 SDK
    const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
    return { uploadUrl, key };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error('Could not generate upload URL');
  }
};

export const getPublicUrl = (key: string) => {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
};
