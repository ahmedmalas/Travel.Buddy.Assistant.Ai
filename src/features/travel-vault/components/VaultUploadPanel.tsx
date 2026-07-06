import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { VAULT_FILE_KINDS, VAULT_ITEM_TYPES, type VaultItemDraft } from '../model/travelVault.types';
import { formatVaultTypeLabel } from '../model/travelVault.utils';

type VaultUploadPanelProps = {
  onCreateItem: (draft: VaultItemDraft) => void;
};

const INITIAL_DRAFT: VaultItemDraft = {
  type: 'flight',
  category: 'flight',
  title: '',
  description: '',
  notes: '',
  tags: [],
  fileKind: 'pdf',
  fileName: '',
  mimeType: '',
  localPath: '',
  previewUrl: '',
  vendor: '',
  confirmationCode: '',
  currency: 'USD',
};

export function VaultUploadPanel({ onCreateItem }: VaultUploadPanelProps) {
  const [draft, setDraft] = useState<VaultItemDraft>(INITIAL_DRAFT);
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canSubmit = useMemo(() => draft.title.trim().length > 1, [draft.title]);

  function updateDraft(nextDraft: Partial<VaultItemDraft>) {
    setDraft((currentDraft) => ({ ...currentDraft, ...nextDraft }));
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      return;
    }
    const previewUrl = selectedFile.type.startsWith('image/') ? URL.createObjectURL(selectedFile) : undefined;
    updateDraft({
      fileName: selectedFile.name,
      mimeType: selectedFile.type,
      sizeBytes: selectedFile.size,
      localPath: selectedFile.name,
      previewUrl,
      fileKind: selectedFile.type.startsWith('image/') ? 'image' : selectedFile.type.includes('pdf') ? 'pdf' : draft.fileKind,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError('Title must be at least 2 characters.');
      return;
    }
    const parsedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    setError(null);
    onCreateItem({
      ...draft,
      title: draft.title.trim(),
      tags: parsedTags,
      amount: typeof draft.amount === 'number' ? draft.amount : undefined,
    });
    setDraft(INITIAL_DRAFT);
    setTagsInput('');
  }

  return (
    <form className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Add vault item</p>
        <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100">Local-first</span>
      </div>

      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
        onChange={(event) => updateDraft({ title: event.target.value })}
        placeholder="Document title"
        value={draft.title}
      />

      <div className="grid gap-2 md:grid-cols-3">
        <select
          className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-100"
          onChange={(event) => {
            const type = event.target.value as VaultItemDraft['type'];
            updateDraft({ type, category: type });
          }}
          value={draft.type}
        >
          {VAULT_ITEM_TYPES.map((type) => (
            <option key={type} value={type}>
              {formatVaultTypeLabel(type)}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-100"
          onChange={(event) => updateDraft({ fileKind: event.target.value as VaultItemDraft['fileKind'] })}
          value={draft.fileKind}
        >
          {VAULT_FILE_KINDS.map((fileKind) => (
            <option key={fileKind} value={fileKind}>
              {formatVaultTypeLabel(fileKind)}
            </option>
          ))}
        </select>
        <input
          className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-100"
          onChange={(event) => updateDraft({ confirmationCode: event.target.value })}
          placeholder="Confirmation code"
          value={draft.confirmationCode}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-100"
          onChange={(event) => updateDraft({ vendor: event.target.value })}
          placeholder="Vendor / provider"
          value={draft.vendor}
        />
        <input
          className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-100"
          onChange={(event) => setTagsInput(event.target.value)}
          placeholder="Tags (comma separated)"
          value={tagsInput}
        />
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <input
          className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-100"
          onChange={(event) => updateDraft({ issuedAt: event.target.value })}
          type="date"
          value={draft.issuedAt?.slice(0, 10) ?? ''}
        />
        <input
          className="rounded-xl border border-white/10 bg-slate-950/80 px-2 py-2 text-xs text-slate-100"
          onChange={(event) => updateDraft({ expiresAt: event.target.value })}
          type="date"
          value={draft.expiresAt?.slice(0, 10) ?? ''}
        />
      </div>

      <textarea
        className="h-16 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none ring-sky-300/40 placeholder:text-slate-500 focus:ring"
        onChange={(event) => updateDraft({ notes: event.target.value })}
        placeholder="Notes"
        value={draft.notes}
      />

      <input
        accept="application/pdf,image/*"
        className="block w-full text-xs text-slate-300 file:mr-4 file:rounded-full file:border file:border-white/15 file:bg-white/[0.03] file:px-3 file:py-1 file:text-xs file:text-slate-100"
        onChange={handleFileSelected}
        type="file"
      />

      {draft.fileName && (
        <p className="text-xs text-slate-300">
          Attached metadata: {draft.fileName} ({draft.mimeType || 'unknown'}){draft.sizeBytes ? ` · ${Math.round(draft.sizeBytes / 1024)} KB` : ''}
        </p>
      )}

      {error && <p className="text-xs text-rose-300">{error}</p>}

      <button
        className="rounded-full border border-sky-300/40 bg-sky-500/15 px-4 py-2 text-sm text-sky-100 transition hover:bg-sky-500/20 disabled:opacity-50"
        disabled={!canSubmit}
        type="submit"
      >
        Save to travel vault
      </button>
    </form>
  );
}
