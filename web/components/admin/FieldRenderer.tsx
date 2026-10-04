'use client';

import type { Field } from '@/lib/resources';
import { ImageUpload } from './FileUpload';
import { inputClass } from './ui';

interface Props {
  field: Field;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}

export function FieldRenderer({ field, value, error, onChange }: Props) {
  const id = `field-${field.name}`;
  const describedBy = [field.help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const common = { id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy } as const;
  const text = typeof value === 'string' ? value : '';

  let control;
  switch (field.type) {
    case 'textarea':
    case 'list':
      control = (
        <textarea
          {...common}
          rows={field.type === 'list' ? 5 : 4}
          value={text}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} resize-y`}
        />
      );
      break;
    case 'select':
      control = (
        <select {...common} value={text} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
      break;
    case 'boolean':
      return (
        <label className="flex items-center gap-3 text-sm font-medium">
          <input id={id} type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-[var(--accent)]" />
          {field.label}
        </label>
      );
    case 'images':
      control = <ImageUpload multiple value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
      break;
    case 'month': {
      const isNull = field.nullable && value === null;
      control = (
        <>
          <input
            {...common}
            type="month"
            // Browsers without a month picker fall back to a text box, so the format is spelled out.
            placeholder="YYYY-MM"
            pattern="\d{4}-\d{2}"
            value={text}
            disabled={isNull}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
          {field.nullable && (
            <label className="mt-2 flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={isNull} onChange={(e) => onChange(e.target.checked ? null : '')} className="size-4 accent-[var(--accent)]" />
              {field.nullLabel ?? 'No end date'}
            </label>
          )}
        </>
      );
      break;
    }
    default:
      control = (
        <input
          {...common}
          type={field.type === 'url' ? 'url' : 'text'}
          value={text}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      );
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-danger" aria-hidden> *</span>}
      </label>
      {control}
      {field.help && <p id={`${id}-help`} className="mt-1.5 text-sm text-muted">{field.help}</p>}
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}
