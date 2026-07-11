export const VAULT_ITEM_TYPES = [
  'flight',
  'hotel',
  'insurance',
  'passport',
  'visa',
  'ticket',
  'reservation',
  'receipt',
  'invoice',
  'pdf',
  'image',
  'note',
  'other',
] as const;

export const VAULT_FILE_KINDS = ['pdf', 'image', 'note', 'link', 'unknown'] as const;

export type VaultItemType = (typeof VAULT_ITEM_TYPES)[number];
export type VaultFileKind = (typeof VAULT_FILE_KINDS)[number];

export type VaultItem = {
  id: string;
  tripId: string;
  type: VaultItemType;
  category: VaultItemType;
  title: string;
  description?: string;
  notes?: string;
  tags: string[];
  fileKind: VaultFileKind;
  fileName?: string;
  mimeType?: string;
  localPath?: string;
  previewUrl?: string;
  sizeBytes?: number;
  issuedAt?: string;
  expiresAt?: string;
  vendor?: string;
  confirmationCode?: string;
  amount?: number;
  currency?: string;
  searchText: string;
  createdAt: string;
  updatedAt: string;
};

export type VaultItemDraft = {
  type: VaultItemType;
  category: VaultItemType;
  title: string;
  description?: string;
  notes?: string;
  tags: string[];
  fileKind: VaultFileKind;
  fileName?: string;
  mimeType?: string;
  localPath?: string;
  previewUrl?: string;
  sizeBytes?: number;
  issuedAt?: string;
  expiresAt?: string;
  vendor?: string;
  confirmationCode?: string;
  amount?: number;
  currency?: string;
};

export type VaultItemUpdate = Partial<Omit<VaultItem, 'id' | 'tripId' | 'createdAt' | 'searchText'>>;

export type VaultFilters = {
  query: string;
  type: VaultItemType | 'all';
  fileKind: VaultFileKind | 'all';
  tag: string | 'all';
  hasExpiry: boolean | 'all';
  sort: 'recent' | 'expiry' | 'type' | 'title';
};

export type VaultCountsByType = Record<VaultItemType, number>;
