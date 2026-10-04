import type { Readable } from 'node:stream';
import mongoose from 'mongoose';
import { AppError } from '../errors.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';

const MB = 1024 * 1024;
export const MAX_UPLOAD_BYTES = 10 * MB;
const MAX_IMAGE_BYTES = 5 * MB;

const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db!, { bucketName: 'uploads' });
const toObjectId = (id: string) =>
  /^[a-f0-9]{24}$/.test(id) ? new mongoose.Types.ObjectId(id) : null;

/** Identifies the file from its leading bytes. The client-declared type is never trusted. */
export function sniffContentType(buf: Buffer): string | null {
  const ascii = (start: number, end: number) => buf.subarray(start, end).toString('latin1');
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(8, 12))) return 'image/avif';
  if (ascii(0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

export interface StoredFile {
  id: string;
  contentType: string;
  filename: string;
}

export async function saveFile(buffer: Buffer, originalName: string): Promise<StoredFile> {
  const contentType = sniffContentType(buffer);
  if (!contentType) {
    throw new AppError(400, 'unsupported_file_type', 'Upload a JPEG, PNG, WebP or AVIF image, or a PDF');
  }
  if (contentType !== 'application/pdf' && buffer.length > MAX_IMAGE_BYTES) {
    throw new AppError(413, 'payload_too_large', 'Images must be 5 MB or smaller');
  }
  // Keep only the base name, without path separators, quotes or control characters.
  const filename = (originalName.split(/[\\/]/).pop() ?? '').replace(/["\r\n\x00-\x1f]/g, '').slice(0, 150) || 'file';

  const stream = bucket().openUploadStream(filename, { metadata: { contentType } });
  await new Promise<void>((resolve, reject) => {
    stream.once('finish', () => resolve());
    stream.once('error', reject);
    stream.end(buffer);
  });
  return { id: String(stream.id), contentType, filename };
}

export interface OpenedFile {
  stream: Readable;
  contentType: string;
  length: number;
  filename: string;
}

export async function openFile(id: string): Promise<OpenedFile | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const [file] = await bucket().find({ _id }).limit(1).toArray();
  if (!file) return null;
  return {
    stream: bucket().openDownloadStream(_id),
    contentType: String(file.metadata?.contentType ?? 'application/octet-stream'),
    length: file.length,
    filename: file.filename,
  };
}

/** Deletes the file and clears every reference to it, so nothing points at a missing file. */
export async function deleteFile(id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  const [file] = await bucket().find({ _id }).limit(1).toArray();
  if (!file) return false;
  await bucket().delete(_id);
  await Promise.all([
    Profile.updateMany({ photoFileId: id }, { $set: { photoFileId: '' } }),
    Profile.updateMany({ resumeFileId: id }, { $set: { resumeFileId: '' } }),
    Project.updateMany({ imageFileIds: id }, { $pull: { imageFileIds: id } }),
  ]);
  return true;
}
