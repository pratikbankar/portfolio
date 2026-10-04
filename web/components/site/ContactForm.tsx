'use client';

import { Check, LoaderCircle, Send } from 'lucide-react';
import { type FormEvent, useEffect, useRef, useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';
type FieldErrors = Partial<Record<'name' | 'email' | 'subject' | 'message', string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(v: { name: string; email: string; message: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!v.name.trim()) errors.name = 'Please enter your name';
  if (!EMAIL.test(v.email.trim())) errors.email = 'Please enter a valid email address';
  if (v.message.trim().length < 10) errors.message = 'Please write at least 10 characters';
  return errors;
}

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none aria-[invalid=true]:border-danger';

export function ContactForm({ disabled = false, fallbackEmail }: { disabled?: boolean; fallbackEmail?: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [problem, setProblem] = useState('');
  const startedAt = useRef(0);

  useEffect(() => {
    startedAt.current = performance.now();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || status === 'sending') return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      subject: String(data.get('subject') ?? ''),
      message: String(data.get('message') ?? ''),
    };

    const found = validate(values);
    setErrors(found);
    setProblem('');
    if (Object.keys(found).length > 0) {
      form.querySelector<HTMLElement>('[aria-invalid="true"], [name="' + Object.keys(found)[0] + '"]')?.focus();
      return;
    }

    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          extra_notes: String(data.get('extra_notes') ?? ''),
          elapsedMs: Math.round(performance.now() - startedAt.current),
        }),
      });
      if (res.ok) {
        form.reset();
        startedAt.current = performance.now();
        setStatus('sent');
        return;
      }
      const body = await res.json().catch(() => null);
      const details: Array<{ path: string; message: string }> = body?.error?.details ?? [];
      if (res.status === 400 && details.length > 0) {
        setErrors(Object.fromEntries(details.map((d) => [d.path, d.message])));
      } else {
        setProblem(
          res.status === 429
            ? 'You have sent several messages already. Please try again later.'
            : 'Your message could not be sent. Please try again in a moment.',
        );
      }
      setStatus('error');
    } catch {
      setProblem('Your message could not be sent. Please check your connection and try again.');
      setStatus('error');
    }
  }

  const error = (name: keyof FieldErrors) =>
    errors[name] ? <p id={`${name}-error`} className="mt-1.5 text-sm text-danger">{errors[name]}</p> : null;
  const aria = (name: keyof FieldErrors) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate className="card relative p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Name
          <input name="name" type="text" autoComplete="name" maxLength={100} className={fieldClass} {...aria('name')} />
          {error('name')}
        </label>
        <label className="block text-sm font-medium">
          Email
          <input name="email" type="email" autoComplete="email" maxLength={200} className={fieldClass} {...aria('email')} />
          {error('email')}
        </label>
      </div>
      <label className="mt-5 block text-sm font-medium">
        Subject <span className="font-normal text-muted">(optional)</span>
        <input name="subject" type="text" maxLength={200} className={fieldClass} {...aria('subject')} />
        {error('subject')}
      </label>
      <label className="mt-5 block text-sm font-medium">
        Message
        <textarea name="message" rows={6} maxLength={5000} className={`${fieldClass} resize-y`} {...aria('message')} />
        {error('message')}
      </label>

      {/* Honeypot: people never see or reach this field; bots that fill it are discarded. */}
      <div className="hp-field" aria-hidden="true">
        <label>
          Leave this field empty
          {/* A neutral name, so browser and password-manager autofill never fills it for a real visitor. */}
          <input name="extra_notes" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={disabled || status === 'sending'}>
          {status === 'sending'
            ? <><LoaderCircle className="size-4 animate-spin" aria-hidden /> Sending</>
            : <><Send className="size-4" aria-hidden /> Send message</>}
        </button>
        <div role="status" aria-live="polite" className="text-sm">
          {disabled && <span className="text-muted">The form is switched off in preview.</span>}
          {status === 'sent' && (
            <span className="inline-flex items-center gap-1.5 text-accent">
              <Check className="size-4" aria-hidden /> Thanks, your message has been sent.
            </span>
          )}
          {status === 'error' && problem && (
            <span className="text-danger">
              {problem}
              {fallbackEmail && <> You can also email <a className="underline" href={`mailto:${fallbackEmail}`}>{fallbackEmail}</a>.</>}
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
