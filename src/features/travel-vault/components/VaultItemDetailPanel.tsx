import { useEffect, useState } from 'react';
import type { VaultItem, VaultItemUpdate } from '../model/travelVault.types';
import { VaultCategoryBadge } from './VaultCategoryBadge';
import { VaultEmptyState } from './VaultEmptyState';
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

  useEffect(() => {
    if (!item) {
      return;
    }
    setTitle(item.title);
    setNotes(item.notes || '');
    setTags(item.tags.join(', '));
    setExpiresAt(item.expiresAt?.slice(0, 10) || '');
  }, [item]);

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
                .split(',')
                .map((tag) => tag.trim().toLowerCase())
                .filter(Boolean),
              expiresAt: expiresAt || undefined,
            })
          }
          type="button"
        >
          Save updates
        </button>
        <button
          className="rounded-full border border-rose-300/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-500/20"
          onClick={() => onRemoveItem(item.id)}
          type="button"
        >
          Remove item
        </button>
      </div>
    </div>
  );
}
