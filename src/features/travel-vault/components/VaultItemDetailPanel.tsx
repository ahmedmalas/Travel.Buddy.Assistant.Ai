import { useEffect, useRef, useState } from 'react';
import type { VaultItem, VaultItemUpdate } from '../model/travelVault.types';
import { VaultCategoryBadge } from './VaultCategoryBadge';
import { VaultEmptyState } from './VaultEmptyState';
import { normalizeVaultTags } from '../model/travelVault.utils';
import { VaultTagChip } from './VaultTagChip';

type VaultItemDetailPanelProps = {
  item: VaultItem | null;
  onUpdateItem: (itemId: string, updates: VaultItemUpdate) => void;
  onRemoveItem: (itemId: string) => void;
};

export function VaultItemDetailPanel({ item, onUpdateItem, onRemoveItem }: VaultItemDetailPanelProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!item) {
      return;
    }
    setTitle(item.title);
    setNotes(item.notes || '');
    setTags(item.tags.join(', '));
    setExpiresAt(item.expiresAt?.slice(0, 10) || '');
  }, [item]);

  useEffect(() => {
    if (!deleteConfirmOpen) {
      return;
    }
    confirmButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        setDeleteConfirmOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [deleteConfirmOpen]);

  if (!item) {
    return <VaultEmptyState title="Select a vault item" description="Pick an item card to inspect metadata and update trip records." />;
  }

  return (
    <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-lg font-semibold text-white">{item.title}</h4>
        <VaultCategoryBadge category={item.category} />
      </div>

      <p className="text-xs text-slate-300">
        {item.fileKind.toUpperCase()} · {item.fileName || 'No file metadata'} · Local-only preview metadata
      </p>

      {item.previewUrl && item.fileKind === 'image' && (
        <img alt={item.title} className="h-32 w-full rounded-2xl border border-white/10 object-cover" src={item.previewUrl} />
      )}

      <div className="space-y-2">
        <label className="block text-xs text-slate-300">
          Title
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1 text-sm text-slate-100"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label className="block text-xs text-slate-300">
          Notes
          <textarea
            className="mt-1 h-20 w-full rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1 text-sm text-slate-100"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </label>
        <label className="block text-xs text-slate-300">
          Tags (comma separated)
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1 text-sm text-slate-100"
            onChange={(event) => setTags(event.target.value)}
            value={tags}
          />
        </label>
        <label className="block text-xs text-slate-300">
          Expiry date
          <input
            className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/80 px-2 py-1 text-sm text-slate-100"
            onChange={(event) => setExpiresAt(event.target.value)}
            type="date"
            value={expiresAt}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <VaultTagChip key={tag} tag={tag} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/20"
          onClick={() =>
            onUpdateItem(item.id, {
              title: title.trim(),
              notes: notes.trim() || undefined,
              tags: tags
                ? normalizeVaultTags(tags.split(','))
                : [],
              expiresAt: expiresAt || undefined,
            })
          }
          type="button"
        >
          Save updates
        </button>
        <button
          className="rounded-full border border-rose-300/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20"
          onClick={() => setDeleteConfirmOpen(true)}
          type="button"
        >
          Remove item
        </button>
      </div>

      {deleteConfirmOpen && (
        <div
          aria-modal="true"
          className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 px-4"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-slate-900 p-4 shadow-2xl">
            <h5 className="text-base font-semibold text-white">Confirm item deletion</h5>
            <p className="mt-2 text-sm text-slate-300">Remove &quot;{item.title}&quot; from this trip vault?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="rounded-full border border-white/20 px-3 py-1.5 text-sm text-slate-200"
                onClick={() => setDeleteConfirmOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-full border border-rose-300/50 bg-rose-500/15 px-3 py-1.5 text-sm text-rose-100"
                onClick={() => {
                  onRemoveItem(item.id);
                  setDeleteConfirmOpen(false);
                }}
                ref={confirmButtonRef}
                type="button"
              >
                Confirm remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
