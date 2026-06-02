alter table public.email_automations
  add column if not exists body_html text,
  add column if not exists attachments jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'email-assets',
  'email-assets',
  true,
  10485760,
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "email_assets_public_read" on storage.objects;
drop policy if exists "email_assets_authenticated_insert" on storage.objects;
drop policy if exists "email_assets_authenticated_update" on storage.objects;
drop policy if exists "email_assets_authenticated_delete" on storage.objects;

create policy "email_assets_public_read"
on storage.objects for select
to public
using (bucket_id = 'email-assets');

create policy "email_assets_authenticated_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'email-assets');

create policy "email_assets_authenticated_update"
on storage.objects for update
to authenticated
using (bucket_id = 'email-assets')
with check (bucket_id = 'email-assets');

create policy "email_assets_authenticated_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'email-assets');
