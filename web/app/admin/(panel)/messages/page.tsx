'use client';

import { Mail, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from '@/components/admin/AdminShell';
import { LoadError, Loading, PageHeader } from '@/components/admin/ui';
import { api } from '@/lib/adminApi';

interface Message {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const { refresh, notify } = useAdmin();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoadError('');
    return api<Message[]>('/admin/messages')
      .then(setMessages)
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : 'Could not load'));
  }, []);

  useEffect(() => {
    let alive = true;
    api<Message[]>('/admin/messages')
      .then((m) => alive && setMessages(m))
      .catch((err: unknown) => alive && setLoadError(err instanceof Error ? err.message : 'Could not load'));
    return () => {
      alive = false;
    };
  }, []);

  if (loadError) return <LoadError message={loadError} onRetry={load} />;
  if (!messages) return <Loading />;

  async function setRead(msg: Message, read: boolean) {
    setMessages((list) => list?.map((m) => (m._id === msg._id ? { ...m, read } : m)) ?? list);
    try {
      await api(`/admin/messages/${msg._id}`, { method: 'PATCH', body: { read } });
      await refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not update the message', 'error');
      await load();
    }
  }

  function toggle(msg: Message) {
    const opening = openId !== msg._id;
    setOpenId(opening ? msg._id : null);
    if (opening && !msg.read) void setRead(msg, true);
  }

  async function remove(id: string) {
    setConfirmId(null);
    try {
      await api(`/admin/messages/${id}`, { method: 'DELETE' });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete the message', 'error');
    }
    await Promise.all([load(), refresh()]);
  }

  return (
    <>
      <PageHeader title="Messages" description="Messages sent through the contact form on your site." />
      {messages.length === 0 ? (
        <div className="card p-10 text-center text-muted">No messages yet.</div>
      ) : (
        <ul className="space-y-2">
          {messages.map((msg) => {
            const open = openId === msg._id;
            return (
              <li key={msg._id} className="card overflow-hidden">
                <button type="button" onClick={() => toggle(msg)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bg">
                  <span aria-hidden className={`size-2 shrink-0 rounded-full ${msg.read ? 'bg-transparent' : 'bg-accent'}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate ${msg.read ? '' : 'font-semibold'}`}>
                      {msg.name}
                      {!msg.read && <span className="sr-only"> (unread)</span>}
                      <span className="font-normal text-muted"> · {msg.subject || 'No subject'}</span>
                    </span>
                    {!open && <span className="block truncate text-sm text-muted">{msg.message}</span>}
                  </span>
                  <time dateTime={msg.createdAt} className="shrink-0 text-xs text-muted">
                    {new Date(msg.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </time>
                </button>
                {open && (
                  <div className="border-t border-line px-4 py-4">
                    {/* Rendered as plain text: whatever a visitor typed is shown, never run. */}
                    <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                      <a href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject || 'your message'}`)}`} className="btn btn-primary !py-2">
                        <Mail className="size-4" aria-hidden /> Reply to {msg.email}
                      </a>
                      <button type="button" className="btn btn-ghost !py-2" onClick={() => setRead(msg, !msg.read)}>
                        Mark as {msg.read ? 'unread' : 'read'}
                      </button>
                      {confirmId === msg._id ? (
                        <>
                          <button type="button" className="btn !bg-danger !py-2 text-white" onClick={() => remove(msg._id)}>Delete for good</button>
                          <button type="button" className="btn btn-ghost !py-2" onClick={() => setConfirmId(null)}>Keep</button>
                        </>
                      ) : (
                        <button type="button" className="btn btn-ghost !py-2" onClick={() => setConfirmId(msg._id)}>
                          <Trash2 className="size-4" aria-hidden /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
