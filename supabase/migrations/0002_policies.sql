-- ===================================================================
-- AquaVision AI — Row Level Security
--
-- Default posture: environmental data is a public good, so approved public
-- reports are world-readable. Everything writable is owner-scoped, with an
-- admin/moderator escape hatch resolved through a SECURITY DEFINER helper so
-- the policies never recurse into `profiles`.
-- ===================================================================

alter table public.profiles      enable row level security;
alter table public.locations     enable row level security;
alter table public.uploads       enable row level security;
alter table public.ai_analysis   enable row level security;
alter table public.reports       enable row level security;
alter table public.comments      enable row level security;
alter table public.notifications enable row level security;

-- ------------------------------------------------------------------
-- Role helpers
--
-- SECURITY DEFINER: a policy on `profiles` that had to SELECT `profiles` to
-- decide access would recurse. Definer rights break the cycle.
-- ------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated, anon;

-- ------------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------------

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------
-- locations — readable by all, created by any signed-in user
-- ------------------------------------------------------------------

drop policy if exists locations_read on public.locations;
create policy locations_read on public.locations
  for select using (true);

drop policy if exists locations_insert on public.locations;
create policy locations_insert on public.locations
  for insert to authenticated with check (auth.uid() is not null);

drop policy if exists locations_staff_write on public.locations;
create policy locations_staff_write on public.locations
  for all using (public.is_staff()) with check (public.is_staff());

-- ------------------------------------------------------------------
-- uploads — owner-scoped, plus public read when a public report exists
-- ------------------------------------------------------------------

drop policy if exists uploads_read on public.uploads;
create policy uploads_read on public.uploads
  for select using (
    user_id = auth.uid()
    or public.is_staff()
    or exists (
      select 1 from public.reports r
       where r.upload_id = uploads.id
         and r.is_public
         and r.status = 'approved'
    )
  );

drop policy if exists uploads_insert_own on public.uploads;
create policy uploads_insert_own on public.uploads
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists uploads_delete_own on public.uploads;
create policy uploads_delete_own on public.uploads
  for delete using (user_id = auth.uid() or public.is_staff());

-- ------------------------------------------------------------------
-- ai_analysis — read follows the visibility of the report that wraps it
-- ------------------------------------------------------------------

drop policy if exists analysis_read on public.ai_analysis;
create policy analysis_read on public.ai_analysis
  for select using (
    public.is_staff()
    or exists (
      select 1 from public.uploads u
       where u.id = ai_analysis.upload_id and u.user_id = auth.uid()
    )
    or exists (
      select 1 from public.reports r
       where r.upload_id = ai_analysis.upload_id
         and r.is_public
         and r.status = 'approved'
    )
  );

drop policy if exists analysis_insert_own_upload on public.ai_analysis;
create policy analysis_insert_own_upload on public.ai_analysis
  for insert to authenticated with check (
    exists (
      select 1 from public.uploads u
       where u.id = ai_analysis.upload_id and u.user_id = auth.uid()
    )
  );

-- Scores are never editable from a normal client session.
drop policy if exists analysis_admin_write on public.ai_analysis;
create policy analysis_admin_write on public.ai_analysis
  for update using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------
-- reports
-- ------------------------------------------------------------------

drop policy if exists reports_read_public on public.reports;
create policy reports_read_public on public.reports
  for select using (
    (is_public and status = 'approved')
    or user_id = auth.uid()
    or public.is_staff()
  );

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.uploads u
       where u.id = upload_id and u.user_id = auth.uid()
    )
  );

drop policy if exists reports_update_own on public.reports;
create policy reports_update_own on public.reports
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists reports_delete_own on public.reports;
create policy reports_delete_own on public.reports
  for delete using (user_id = auth.uid() or public.is_staff());

drop policy if exists reports_staff_moderate on public.reports;
create policy reports_staff_moderate on public.reports
  for update using (public.is_staff()) with check (public.is_staff());

-- ------------------------------------------------------------------
-- comments
-- ------------------------------------------------------------------

drop policy if exists comments_read on public.comments;
create policy comments_read on public.comments
  for select using (
    exists (
      select 1 from public.reports r
       where r.id = comments.report_id
         and ((r.is_public and r.status = 'approved') or r.user_id = auth.uid())
    )
    or public.is_staff()
  );

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists comments_delete_own on public.comments;
create policy comments_delete_own on public.comments
  for delete using (user_id = auth.uid() or public.is_staff());

-- ------------------------------------------------------------------
-- notifications — strictly private
-- ------------------------------------------------------------------

drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own on public.notifications
  for select using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete using (user_id = auth.uid());

-- ------------------------------------------------------------------
-- Storage bucket
-- ------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'water-uploads',
  'water-uploads',
  true,
  10485760, -- 10 MB; the client compresses to ~1.5 MB before upload
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 10485760,
      allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

drop policy if exists "water uploads are publicly readable" on storage.objects;
create policy "water uploads are publicly readable" on storage.objects
  for select using (bucket_id = 'water-uploads');

-- Objects live at `<user-id>/<uuid>.<ext>`, so the first path segment is the
-- ownership check.
drop policy if exists "users upload to their own folder" on storage.objects;
create policy "users upload to their own folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'water-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete their own objects" on storage.objects;
create policy "users delete their own objects" on storage.objects
  for delete to authenticated using (
    bucket_id = 'water-uploads'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
  );
