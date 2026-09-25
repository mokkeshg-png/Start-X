import { supabaseAdmin, supabaseClient } from "../config/supabase";
import { env } from "../config/env";
import { AppError } from "../utils";

/**
 * Storage service abstraction over Supabase Storage.
 *
 * Supports upload, download, delete, and signed URL generation.
 * Bucket name is read from SUPABASE_STORAGE_BUCKET env var.
 *
 * NOTE: Do not call these methods until the bucket has been created in Supabase.
 */
export const storageService = {
  /**
   * Get the configured storage bucket name.
   * @throws 503 if not configured.
   */
  getBucket(): string {
    const bucket = env.SUPABASE_STORAGE_BUCKET;
    if (!bucket) {
      throw new AppError(
        "Storage bucket is not configured. Set SUPABASE_STORAGE_BUCKET in .env",
        503
      );
    }
    return bucket;
  },

  /**
   * Get a Supabase client with storage access.
   * Prefers the admin client (service role) for full access.
   * @throws 503 if Supabase is not configured.
   */
  getStorageClient() {
    const client = supabaseAdmin ?? supabaseClient;
    if (!client) {
      throw new AppError(
        "Supabase is not configured. Set SUPABASE_URL and credentials in .env",
        503
      );
    }
    return client;
  },

  /**
   * Upload a file to Supabase Storage.
   *
   * @param filePath - Path within the bucket (e.g. "projects/uuid/report.pdf")
   * @param fileBuffer - The file content as a Buffer
   * @param contentType - MIME type of the file
   * @param upsert - Whether to overwrite existing file (default: false)
   */
  async upload(
    filePath: string,
    fileBuffer: Buffer,
    contentType: string,
    upsert = false
  ) {
    const client = this.getStorageClient();
    const bucket = this.getBucket();

    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert,
      });

    if (error) {
      throw AppError.badRequest(`File upload failed: ${error.message}`);
    }

    return data;
  },

  /**
   * Download a file from Supabase Storage.
   *
   * @param filePath - Path within the bucket
   * @returns Blob data
   */
  async download(filePath: string) {
    const client = this.getStorageClient();
    const bucket = this.getBucket();

    const { data, error } = await client.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      throw AppError.notFound(`File not found: ${error.message}`);
    }

    return data;
  },

  /**
   * Delete one or more files from Supabase Storage.
   *
   * @param filePaths - Array of file paths within the bucket
   */
  async delete(filePaths: string[]) {
    const client = this.getStorageClient();
    const bucket = this.getBucket();

    const { data, error } = await client.storage
      .from(bucket)
      .remove(filePaths);

    if (error) {
      throw AppError.badRequest(`File deletion failed: ${error.message}`);
    }

    return data;
  },

  /**
   * Generate a time-limited signed URL for a private file.
   *
   * @param filePath - Path within the bucket
   * @param expiresInSeconds - URL validity duration (default: 1 hour)
   */
  async getSignedUrl(filePath: string, expiresInSeconds = 3600) {
    const client = this.getStorageClient();
    const bucket = this.getBucket();

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      throw AppError.badRequest(`Failed to create signed URL: ${error.message}`);
    }

    return data;
  },
};
