import type { Readable } from 'node:stream';
import mongoose from 'mongoose';
import { AppError } from '../errors.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { PublishedSnapshot } from '../models/PublishedSnapshot.js';

const MB = 1024 * 1024;
// The hosting platform caps request bodies at 4.5 MB; staying under it keeps errors readable.
export const MAX_UPLOAD_BYTES = 4 * MB;

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

/**
 * Deletes the file and clears every draft reference to it, so nothing points at a missing file.
 * A file the published site still shows cannot be deleted: that would break the live page.
 */
export async function deleteFile(id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  const [file] = await bucket().find({ _id }).limit(1).toArray();
  if (!file) return false;
  const snapshot = await PublishedSnapshot.findOne({ key: 'main' }).lean();
  if (snapshot && JSON.stringify(snapshot.content).includes(id)) {
    throw new AppError(409, 'file_in_use', 'The live site still uses this file. Replace it and publish first.');
  }
  await bucket().delete(_id);
  await Promise.all([
    Profile.updateMany({ photoFileId: id }, { $set: { photoFileId: '' } }),
    Profile.updateMany({ resumeFileId: id }, { $set: { resumeFileId: '' } }),
    Project.updateMany({ imageFileIds: id }, { $pull: { imageFileIds: id } }),
  ]);
  return true;
}

const UNUSED_GRACE_MS = 24 * 60 * 60 * 1000;

/**
 * Removes uploads that the given content no longer refers to. Recent uploads are kept,
 * because a file may be uploaded a moment before the form that uses it is saved.
 */
export async function removeUnusedFiles(content: unknown): Promise<number> {
  const inUse = JSON.stringify(content);
  const cutoff = new Date(Date.now() - UNUSED_GRACE_MS);
  const stale = await bucket().find({ uploadDate: { $lt: cutoff } }).toArray();
  const unused = stale.filter((f) => !inUse.includes(String(f._id)));
  for (const file of unused) await bucket().delete(file._id);
  return unused.length;
}
