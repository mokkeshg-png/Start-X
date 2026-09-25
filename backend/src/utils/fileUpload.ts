import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/** Maximum file size: 50 MB (per PRD requirement) */
const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Dangerous file extensions that are always blocked,
 * regardless of any other validation.
 */
const BLOCKED_EXTENSIONS = new Set([
  ".exe", ".bat", ".cmd", ".com", ".scr", ".pif", ".msi",
  ".vbs", ".vbe", ".wsf", ".wsh",
  ".ps1", ".psm1", ".psd1",
  ".hta", ".cpl", ".inf", ".reg",
  ".dll", ".sys", ".drv",
]);

/**
 * Sanitize a filename:
 * - Strip directory components to prevent path traversal
 * - Remove special / non-ASCII characters
 * - Prefix with a UUID for uniqueness
 * - Truncate base name to 100 chars
 */
export function sanitizeFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext);

  const sanitized = baseName
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 100);

  const safeName = sanitized.length > 0 ? sanitized : "file";
  return `${uuidv4()}_${safeName}${ext}`;
}

/**
 * Check whether a file extension is allowed (not blocked).
 */
export function isAllowedExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return !BLOCKED_EXTENSIONS.has(ext);
}

/**
 * Multer file filter — rejects dangerous file types.
 * Never trusts the client-provided MIME type alone; validates extension.
 */
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!isAllowedExtension(file.originalname)) {
    const ext = path.extname(file.originalname);
    cb(new Error(`File type not allowed: ${ext}`));
    return;
  }
  cb(null, true);
};

/**
 * Pre-configured multer instance.
 *
 * - Memory storage (files held in buffer for upload to Supabase Storage)
 * - 50 MB max file size
 * - Dangerous extensions blocked
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/** Public constants for documentation and validation layers */
export const FILE_UPLOAD_CONFIG = {
  maxFileSize: MAX_FILE_SIZE,
  maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
  blockedExtensions: Array.from(BLOCKED_EXTENSIONS),
} as const;
