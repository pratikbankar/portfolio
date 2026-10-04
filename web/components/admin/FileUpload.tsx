'use client';

import { LoaderCircle, Trash2, Upload } from 'lucide-react';
import { useId, useState } from 'react';
import { uploadFile } from '@/lib/adminApi';

const IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/avif';

function Thumb({ id, onRemove }: { id: string; onRemove: () => void }) {
  return (
    <li className="group relative aspect-video overflow-hidden rounded-lg border border-line bg-bg">
      {/* Admin-only thumbnail of an uploaded file; the public site uses the optimized next/image. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/api/files/${id}`} alt="" className="size-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-black/70 text-white hover:bg-danger"
      >
        <Trash2 className="size-4" aria-hidden />
      </button>
    </li>
  );
}

interface Props {
  /** Current file ids. A single-image field passes zero or one id. */
  value: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  max?: number;
}

/** Uploads images straight away and reports their ids; the surrounding form saves the reference. */
export function ImageUpload({ value, onChange, multiple = false, max = 12 }: Props) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const full = value.length >= (multiple ? max : 1);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError('');
    const added: string[] = [];
    try {
      for (const file of [...files].slice(0, multiple ? max - value.length : 1)) {
        added.push((await uploadFile(file)).id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      if (added.length) onChange(multiple ? [...value, ...added] : added);
      setBusy(false);
    }
  }

  return (
    <div className="mt-1.5">
      {value.length > 0 && (
        <ul className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((id) => <Thumb key={id} id={id} onRemove={() => onChange(value.filter((v) => v !== id))} />)}
        </ul>
      )}
      {(!full || !multiple) && (
        <label htmlFor={inputId} className={`btn btn-ghost ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
          {busy ? 'Uploading' : value.length && !multiple ? 'Replace image' : 'Upload image'}
        </label>
      )}
      <input
        id={inputId}
        type="file"
        accept={IMAGE_TYPES}
        multiple={multiple}
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
    </div>
  );
}
