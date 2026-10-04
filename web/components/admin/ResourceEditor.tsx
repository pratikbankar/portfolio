'use client';

import {
  closestCenter, DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/adminApi';
import { emptyValues, type Item, type Resource, resources, toPayload, toValues, type Values } from '@/lib/resources';
import { useAdmin } from './AdminShell';
import { FieldRenderer } from './FieldRenderer';
import { LoadError, Loading, PageHeader } from './ui';

interface RowProps {
  item: Item;
  resource: Resource;
  confirming: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}

function Row({ item, resource, confirming, onEdit, onAskDelete, onCancelDelete, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item._id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`card flex items-center gap-2 p-3 sm:gap-3 ${isDragging ? 'relative z-10 shadow-lg' : ''}`}
    >
      <button
        type="button"
        className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink active:cursor-grabbing"
        aria-label={`Reorder ${resource.primary(item)}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{resource.primary(item)}</p>
        <p className="truncate text-sm text-muted">{resource.secondary(item)}</p>
      </div>
      {confirming ? (
        <div className="flex shrink-0 items-center gap-2 text-sm">
          <span className="hidden text-muted sm:inline">Delete this {resource.singular}?</span>
          <button type="button" className="btn !bg-danger !px-3 !py-1.5 text-white" onClick={onDelete}>Delete</button>
          <button type="button" className="btn btn-ghost !px-3 !py-1.5" onClick={onCancelDelete}>Keep</button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={onEdit} aria-label={`Edit ${resource.primary(item)}`} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-bg hover:text-accent">
            <Pencil className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={onAskDelete} aria-label={`Delete ${resource.primary(item)}`} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-bg hover:text-danger">
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </li>
  );
}

/** List, add, edit, delete and drag-to-reorder for one collection. */
export function ResourceEditor({ slug }: { slug: string }) {
  const resource = resources[slug];
  const { refresh, notify } = useAdmin();
  const [items, setItems] = useState<Item[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<Item | 'new' | null>(null);
  const [values, setValues] = useState<Values>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setItems(await api<Item[]>(resource.endpoint));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load');
    }
  }, [resource.endpoint]);

  useEffect(() => {
    let alive = true;
    api<Item[]>(resource.endpoint)
      .then((data) => alive && setItems(data))
      .catch((err: unknown) => alive && setLoadError(err instanceof Error ? err.message : 'Could not load'));
    return () => {
      alive = false;
    };
  }, [resource.endpoint]);

  const closeForm = useCallback(() => {
    setEditing(null);
    setFieldErrors({});
    setFormError('');
  }, []);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeForm();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [editing, closeForm]);

  function openForm(target: Item | 'new') {
    setValues(target === 'new' ? emptyValues(resource.fields) : toValues(resource.fields, target));
    setFieldErrors({});
    setFormError('');
    setEditing(target);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFieldErrors({});
    setFormError('');
    try {
      const body = toPayload(resource.fields, values);
      if (editing === 'new') await api(resource.endpoint, { method: 'POST', body });
      else await api(`${resource.endpoint}/${editing._id}`, { method: 'PUT', body });
      closeForm();
      notify('Saved as a draft. Publish to make it live.');
      await Promise.all([load(), refresh()]);
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length > 0) setFieldErrors(err.fields);
      setFormError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    setConfirmId(null);
    try {
      await api(`${resource.endpoint}/${id}`, { method: 'DELETE' });
      notify('Deleted. Publish to remove it from the live site.');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not delete', 'error');
    }
    await Promise.all([load(), refresh()]);
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!items || !over || active.id === over.id) return;
    const from = items.findIndex((i) => i._id === active.id);
    const to = items.findIndex((i) => i._id === over.id);
    if (from < 0 || to < 0) return;
    const next = arrayMove(items, from, to);
    setItems(next); // show the new order immediately
    try {
      await api(`${resource.endpoint}/reorder`, { method: 'PUT', body: { ids: next.map((i) => i._id) } });
      await refresh();
    } catch (err) {
      notify(err instanceof Error ? `Could not save the new order. ${err.message}` : 'Could not save the new order', 'error');
      await load(); // put the list back to what the server has
    }
  }

  return (
    <>
      <PageHeader
        title={resource.title}
        description={resource.description}
        action={
          <button type="button" className="btn btn-primary" onClick={() => openForm('new')}>
            <Plus className="size-4" aria-hidden /> Add {resource.singular}
          </button>
        }
      />

      {loadError ? (
        <LoadError message={loadError} onRetry={load} />
      ) : items === null ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          Nothing here yet. Add your first {resource.singular}; this section stays hidden on the site until it has content.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {items.map((item) => (
                <Row
                  key={item._id}
                  item={item}
                  resource={resource}
                  confirming={confirmId === item._id}
                  onEdit={() => openForm(item)}
                  onAskDelete={() => setConfirmId(item._id)}
                  onCancelDelete={() => setConfirmId(null)}
                  onDelete={() => remove(item._id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onMouseDown={(e) => e.target === e.currentTarget && closeForm()}>
          <div role="dialog" aria-modal="true" aria-labelledby="editor-title" className="flex h-full w-full max-w-xl flex-col bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 id="editor-title" className="font-display text-xl font-semibold">
                {editing === 'new' ? `Add ${resource.singular}` : `Edit ${resource.singular}`}
              </h2>
              <button type="button" onClick={closeForm} aria-label="Close" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-bg hover:text-ink">
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <form onSubmit={save} noValidate className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {resource.fields.map((field) => (
                  <FieldRenderer
                    key={field.name}
                    field={field}
                    value={values[field.name]}
                    error={fieldErrors[field.name]}
                    onChange={(v) => setValues((prev) => ({ ...prev, [field.name]: v }))}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line px-6 py-4">
                {formError && <p className="mr-auto text-sm text-danger" role="alert">{formError}</p>}
                <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
                  {saving ? 'Saving' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
