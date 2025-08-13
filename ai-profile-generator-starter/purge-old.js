// Purge old objects from S3/R2 based on LastModified
// Usage:
//   PURGE_MAX_AGE_DAYS=14 node purge-old.js
//   PURGE_DRY_RUN=true node purge-old.js
import 'dotenv/config';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const DAYS = Number(process.env.PURGE_MAX_AGE_DAYS || 14);
const DRY = String(process.env.PURGE_DRY_RUN || 'false').toLowerCase() === 'true';

const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: true,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

const Bucket = process.env.S3_BUCKET;
const Prefix = process.env.S3_PREFIX || '';

if (!Bucket) {
  console.error('Missing S3_BUCKET');
  process.exit(1);
}

function olderThan(dateStr, days) {
  const lm = new Date(dateStr).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return lm < cutoff;
}

async function run() {
  let KeyCountTotal = 0;
  let DeletedTotal = 0;
  let ContinuationToken = undefined;

  while (true) {
    const resp = await s3.send(new ListObjectsV2Command({ Bucket, Prefix, ContinuationToken }));
    const Contents = resp.Contents || [];
    KeyCountTotal += Contents.length;

    const toDelete = Contents
      .filter(obj => obj.Key && obj.LastModified && olderThan(obj.LastModified, DAYS))
      .map(obj => ({ Key: obj.Key }));

    if (toDelete.length) {
      if (DRY) {
        console.log(`[DRY RUN] Would delete ${toDelete.length} objects older than ${DAYS}d`);
      } else {
        const del = await s3.send(new DeleteObjectsCommand({ Bucket, Delete: { Objects: toDelete } }));
        DeletedTotal += (del.Deleted || []).length;
        console.log(`Deleted ${toDelete.length} objects`);
      }
    }

    if (!resp.IsTruncated) break;
    ContinuationToken = resp.NextContinuationToken;
  }

  console.log(`Scanned ${KeyCountTotal} objects. ${DRY ? 'Dry-run complete.' : 'Deleted ' + DeletedTotal + ' objects.'}`);
}

run().catch(err => {
  console.error('Purge failed:', err);
  process.exit(1);
});
