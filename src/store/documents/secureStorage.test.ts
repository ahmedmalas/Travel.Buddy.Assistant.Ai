import { describe, expect, it, vi } from 'vitest';
import {
  buildDocumentStoragePath,
  createSignedDocumentUrl,
  MAX_DOCUMENT_BYTES,
  uploadTravelDocument,
  validateDocumentFile,
} from './secureStorage';

describe('secure document storage', () => {
  it('validates mime types and size limits', () => {
    expect(validateDocumentFile({ fileName: 'a.pdf', mimeType: 'application/pdf', sizeBytes: 10 }).ok).toBe(true);
    expect(validateDocumentFile({ fileName: 'a.exe', mimeType: 'application/x-msdownload', sizeBytes: 10 }).ok).toBe(false);
    expect(
      validateDocumentFile({ fileName: 'big.pdf', mimeType: 'application/pdf', sizeBytes: MAX_DOCUMENT_BYTES + 1 }).ok,
    ).toBe(false);
  });

  it('builds private storage paths under user/trip/document', () => {
    expect(buildDocumentStoragePath('user-1', 'trip-1', 'doc-1', 'Passport Scan.pdf')).toBe(
      'user-1/trip-1/doc-1/Passport_Scan.pdf',
    );
  });

  it('uses local:// fallback without a client', async () => {
    const result = await uploadTravelDocument(
      {
        tripId: 'trip-1',
        documentId: 'doc-1',
        fileName: 'visa.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 128,
      },
      null,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.path.startsWith('local://')).toBe(true);
    }
  });

  it('creates signed URLs via supabase storage mock', async () => {
    const client = {
      storage: {
        from: () => ({
          createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.example/doc' }, error: null }),
        }),
      },
    } as never;
    const result = await createSignedDocumentUrl('user/trip/doc/file.pdf', 30, client);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toContain('signed.example');
  });
});
