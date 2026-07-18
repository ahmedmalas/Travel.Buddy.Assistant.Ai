import type { TravelBuddyClient } from '../../lib/supabase/client';
import { getSupabaseClient } from '../../lib/supabase/client';

export const DOCUMENT_BUCKET = 'travel-documents';
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
] as const;

export type DocumentUploadInput = {
  tripId: string;
  documentId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  bytes?: ArrayBuffer | Uint8Array | Blob | null;
};

export type DocumentStorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export const validateDocumentFile = (input: Pick<DocumentUploadInput, 'fileName' | 'mimeType' | 'sizeBytes'>): DocumentStorageResult<true> => {
  if (!input.fileName.trim()) return { ok: false, message: 'File name is required.' };
  if (input.sizeBytes <= 0) return { ok: false, message: 'File is empty.' };
  if (input.sizeBytes > MAX_DOCUMENT_BYTES) {
    return { ok: false, message: `File exceeds ${MAX_DOCUMENT_BYTES / (1024 * 1024)}MB limit.` };
  }
  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(input.mimeType as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number])) {
    return { ok: false, message: `MIME type ${input.mimeType || '(missing)'} is not allowed.` };
  }
  return { ok: true, value: true };
};

export const buildDocumentStoragePath = (userId: string, tripId: string, documentId: string, fileName: string): string => {
  const safeName = fileName.replace(/[^\w.\-]+/g, '_').slice(0, 120);
  return `${userId}/${tripId}/${documentId}/${safeName}`;
};

export async function uploadTravelDocument(
  input: DocumentUploadInput,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<DocumentStorageResult<{ path: string; signedUrl: string | null }>> {
  const validation = validateDocumentFile(input);
  if (!validation.ok) return validation;

  if (!client) {
    return {
      ok: true,
      value: {
        path: `local://${input.tripId}/${input.documentId}/${input.fileName}`,
        signedUrl: null,
      },
    };
  }

  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError || !userData.user) {
    return { ok: false, message: 'Sign in required to upload documents to private storage.' };
  }

  const path = buildDocumentStoragePath(userData.user.id, input.tripId, input.documentId, input.fileName);
  if (!input.bytes) {
    // Metadata-only reservation when no binary is provided (UI placeholder mode).
    const { error: metaError } = await client.from('document_objects').upsert({
      id: input.documentId,
      trip_id: input.tripId,
      owner_id: userData.user.id,
      title: input.fileName,
      doc_type: 'other',
      storage_path: path,
      mime_type: input.mimeType,
      size_bytes: input.sizeBytes,
      metadata: { reserved: true },
    });
    if (metaError) return { ok: false, message: metaError.message };
    return { ok: true, value: { path, signedUrl: null } };
  }

  const { error } = await client.storage.from(DOCUMENT_BUCKET).upload(path, input.bytes, {
    contentType: input.mimeType,
    upsert: true,
  });
  if (error) return { ok: false, message: error.message };

  await client.from('document_objects').upsert({
    id: input.documentId,
    trip_id: input.tripId,
    owner_id: userData.user.id,
    title: input.fileName,
    doc_type: 'other',
    storage_path: path,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    metadata: {},
  });

  const signed = await createSignedDocumentUrl(path, 60, client);
  return {
    ok: true,
    value: { path, signedUrl: signed.ok ? signed.value : null },
  };
}

export async function createSignedDocumentUrl(
  path: string,
  expiresInSeconds = 60,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<DocumentStorageResult<string>> {
  if (path.startsWith('local://')) {
    return { ok: true, value: path };
  }
  if (!client) {
    return { ok: false, message: 'Cloud storage is not configured.' };
  }
  const { data, error } = await client.storage.from(DOCUMENT_BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error || !data?.signedUrl) return { ok: false, message: error?.message ?? 'Unable to create signed URL.' };
  return { ok: true, value: data.signedUrl };
}

export async function deleteTravelDocumentFile(
  path: string,
  documentId?: string,
  client: TravelBuddyClient | null = getSupabaseClient(),
): Promise<DocumentStorageResult<true>> {
  if (path.startsWith('local://') || !client) {
    return { ok: true, value: true };
  }
  const { error } = await client.storage.from(DOCUMENT_BUCKET).remove([path]);
  if (error) return { ok: false, message: error.message };
  if (documentId) {
    await client.from('document_objects').delete().eq('id', documentId);
  }
  return { ok: true, value: true };
}
