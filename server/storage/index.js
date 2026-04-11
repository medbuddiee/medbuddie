/**
 * Storage abstraction for guideline content files.
 *
 * Switch providers by setting STORAGE_PROVIDER in .env:
 *   STORAGE_PROVIDER=local   → reads from server/guidelines-content/
 *   STORAGE_PROVIDER=s3      → reads from AWS S3 (set S3_BUCKET + AWS credentials)
 *
 * The calling code never needs to change — only the env var.
 */

const fs   = require('fs').promises;
const path = require('path');

const PROVIDER  = process.env.STORAGE_PROVIDER || 'local';
const LOCAL_DIR = process.env.GUIDELINES_LOCAL_DIR
    || path.join(__dirname, '../guidelines-content');

/**
 * Fetch and parse a guideline content file.
 *
 * @param {string} fileKey  Relative path inside the content store, e.g.
 *                          "cardiovascular/esh-hypertension-2023.json"
 * @returns {Promise<object>} Parsed JSON content object
 * @throws  Will throw if file not found or JSON is invalid
 */
async function getGuidelineContent(fileKey) {
    if (PROVIDER === 's3') {
        // ── AWS S3 path ────────────────────────────────────────────────────
        // Requires: @aws-sdk/client-s3  (npm install @aws-sdk/client-s3)
        //           AWS_REGION, S3_BUCKET env vars + valid AWS credentials
        const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

        const client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
        const bucket = process.env.S3_BUCKET;
        if (!bucket) throw new Error('S3_BUCKET env var is not set');

        const command = new GetObjectCommand({ Bucket: bucket, Key: fileKey });
        const response = await client.send(command);

        // Stream → string
        const chunks = [];
        for await (const chunk of response.Body) chunks.push(chunk);
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));

    } else {
        // ── Local file-system path ─────────────────────────────────────────
        const filePath = path.join(LOCAL_DIR, fileKey);
        // Guard against path-traversal attacks
        const resolved = path.resolve(filePath);
        const base     = path.resolve(LOCAL_DIR);
        if (!resolved.startsWith(base + path.sep) && resolved !== base) {
            throw new Error('Invalid fileKey — path traversal detected');
        }
        const raw = await fs.readFile(resolved, 'utf8');
        return JSON.parse(raw);
    }
}

module.exports = { getGuidelineContent };
