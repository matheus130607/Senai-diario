import { isSupabaseConfigured, supabase } from './supabaseClient';

const EMAIL_ASSETS_BUCKET = 'email-assets';

const normalizeSegment = (value, fallback = 'asset') => (
  String(value || fallback)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    || fallback
);

const fileExtension = (file) => {
  const fromName = String(file?.name || '').split('.').pop();
  if (fromName && fromName !== file?.name) return normalizeSegment(fromName, 'bin');
  const fromType = String(file?.type || '').split('/').pop();
  return normalizeSegment(fromType, 'bin');
};

export const uploadEmailAsset = async (file, automationId = 'draft', kind = 'attachments') => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase nao configurado para upload de arquivos.');
  }

  if (!file) {
    throw new Error('Selecione um arquivo para upload.');
  }

  const safeKind = kind === 'images' ? 'images' : 'attachments';
  const safeAutomationId = normalizeSegment(automationId || 'draft', 'draft');
  const safeName = normalizeSegment(String(file.name || `asset.${fileExtension(file)}`), 'asset');
  const path = `automations/${safeAutomationId}/${safeKind}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from(EMAIL_ASSETS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type || undefined,
      upsert: true,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(EMAIL_ASSETS_BUCKET)
    .getPublicUrl(path);

  return {
    name: file.name || safeName,
    size: file.size || 0,
    type: file.type || 'application/octet-stream',
    path,
    publicUrl: data?.publicUrl || '',
  };
};
