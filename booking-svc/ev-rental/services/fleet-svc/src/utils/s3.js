const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { fromEnv } = require('@aws-sdk/credential-providers');

function getConfig() {
  const region = process.env.S3_REGION || process.env.AWS_REGION;
  const bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
  const expires = Number(process.env.S3_PRESIGN_EXPIRES || 300);
  if (!region) throw new Error('S3_REGION (or AWS_REGION) is not set');
  if (!bucket) throw new Error('S3_BUCKET (or AWS_S3_BUCKET_NAME) is not set');
  return { region, bucket, expires };
}

function getS3() {
  const { region } = getConfig();
  // Force using environment credentials for clarity in local/dev containers
  // (avoids falling back to other providers when envs are intended source)
  return new S3Client({ region, credentials: fromEnv() });
}

async function presignUpload(key, contentType, tags) {
  const { bucket, expires } = getConfig();
  const s3 = getS3();
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    Tagging: tags,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: expires });
  return { url };
}

module.exports = { presignUpload };
