const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const s3 = new S3Client({ region: process.env.S3_REGION });

async function presignUpload(key, contentType, tags) {
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    Tagging: tags
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: Number(process.env.S3_PRESIGN_EXPIRES || 300) });
  return { url };
}

module.exports = { presignUpload };
