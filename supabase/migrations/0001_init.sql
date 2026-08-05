-- ===================================================================
-- AquaVision AI — initial schema
-- PostgreSQL 15+ / Supabase
--
-- Normalised to 3NF. `profiles` mirrors auth.users; every user-generated
-- artefact hangs off it. One upload has exactly one ai_analysis and at most
-- one report, which is what lets the trend engine treat a location's reports
-- as a clean time series.
-- ===================================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ------------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------------

do $$ begin
  create type water_body_type as enum
    ('river', 'lake', 'reservoir', 'pond', 'canal', 'sea', 'wetland', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type water_quality as enum
    ('Excellent', 'Good', 'Moderate', 'Poor', 'Critical');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('user', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type moderation_status as enum
    ('pending', 'approved', 'flagged', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_kind as enum
    ('nearby_report', 'pollution_increase', 'critical_trend', 'comment',
     'achievement', 'moderation');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------------

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null unique,
  full_name     text,
  avatar_url    text,
  role          user_role not null default 'user',
  bio           text,
  region        text,
  points        integer not null default 0 check (points >= 0),
  -- Notification preferences, kept inline: they are 1:1 with the profile and
  -- always read together with it.
  notify_nearby boolean not null default true,
  notify_trend  boolean not null default true,
  notify_radius_km integer not null default 25 check (notify_radius_km between 1 and 500),
  home_latitude  double precision check (home_latitude between -90 and 90),
  home_longitude double precision check (home_longitude between -180 and 180),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Public user profile, 1:1 with auth.users. Created by the on_auth_user_created trigger.';

create index if not exists profiles_points_idx on public.profiles (points desc);
create index if not exists profiles_role_idx on public.profiles (role);

-- ------------------------------------------------------------------
-- locations
-- ------------------------------------------------------------------

create table if not exists public.locations (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  water_body_type  water_body_type not null default 'other',
  region           text,
  country          text,
  latitude         double precision not null check (latitude between -90 and 90),
  longitude        double precision not null check (longitude between -180 and 180),
  description      text,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now()
);

comment on table public.locations is
  'Canonical water bodies. Reports cluster on these so the trend engine has a stable key.';

create index if not exists locations_geo_idx on public.locations (latitude, longitude);
create index if not exists locations_region_idx on public.locations (region);
create index if not exists locations_type_idx on public.locations (water_body_type);
create index if not exists locations_name_trgm_idx
  on public.locations using gin (name gin_trgm_ops);

-- ------------------------------------------------------------------
-- uploads
-- ------------------------------------------------------------------

create table if not exists public.uploads (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  location_id   uuid references public.locations(id) on delete set null,
  image_url     text not null,
  thumbnail_url text,
  storage_path  text,
  width         integer check (width > 0),
  height        integer check (height > 0),
  bytes         integer check (bytes > 0),
  mime_type     text check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  captured_at   timestamptz,
  latitude      double precision check (latitude between -90 and 90),
  longitude     double precision check (longitude between -180 and 180),
  -- Colourimetric features measured client-side; kept for auditability and to
  -- let the heuristic engine be re-run without the original file.
  image_features jsonb,
  created_at    timestamptz not null default now()
);

create index if not exists uploads_user_idx on public.uploads (user_id, created_at desc);
create index if not exists uploads_location_idx on public.uploads (location_id, created_at desc);
create index if not exists uploads_geo_idx on public.uploads (latitude, longitude);

-- ------------------------------------------------------------------
-- ai_analysis
-- ------------------------------------------------------------------

create table if not exists public.ai_analysis (
  id               uuid primary key default gen_random_uuid(),
  upload_id        uuid not null unique references public.uploads(id) on delete cascade,
  model            text not null,
  pollution_score  integer not null check (pollution_score between 0 and 100),
  water_quality    water_quality not null,
  clarity_score    integer not null default 0 check (clarity_score between 0 and 100),
  confidence       integer not null check (confidence between 0 and 100),
  detected_objects text[] not null default '{}',
  pollution_tags   text[] not null default '{}',
  explanation      text not null default '',
  recommendations  text[] not null default '{}',
  indicators       jsonb not null default '[]',
  raw_response     jsonb,
  latency_ms       integer,
  -- Set when the heuristic engine produced the result rather than a vision API.
  is_simulated     boolean not null default false,
  created_at       timestamptz not null default now()
);

comment on column public.ai_analysis.pollution_score is
  '0 = pristine, 100 = ecological emergency. Recomputed from the weighted indicator matrix, not taken raw from the model.';

create index if not exists ai_analysis_score_idx on public.ai_analysis (pollution_score desc);
create index if not exists ai_analysis_quality_idx on public.ai_analysis (water_quality);
create index if not exists ai_analysis_tags_idx on public.ai_analysis using gin (pollution_tags);

-- ------------------------------------------------------------------
-- reports
-- ------------------------------------------------------------------

create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  upload_id         uuid not null unique references public.uploads(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  location_id       uuid references public.locations(id) on delete set null,
  title             text not null check (char_length(title) between 3 and 160),
  description       text check (char_length(description) <= 4000),
  observations      text[] not null default '{}',
  severity_override integer check (severity_override between 0 and 100),
  status            moderation_status not null default 'approved',
  is_public         boolean not null default true,
  share_token       text not null unique default encode(gen_random_bytes(9), 'hex'),
  view_count        integer not null default 0 check (view_count >= 0),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists reports_created_idx on public.reports (created_at desc);
create index if not exists reports_user_idx on public.reports (user_id, created_at desc);
create index if not exists reports_location_idx on public.reports (location_id, created_at desc);
create index if not exists reports_status_idx on public.reports (status);
create index if not exists reports_title_trgm_idx
  on public.reports using gin (title gin_trgm_ops);

-- ------------------------------------------------------------------
-- comments
-- ------------------------------------------------------------------

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists comments_report_idx on public.comments (report_id, created_at desc);

-- ------------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------------

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        notification_kind not null,
  title       text not null,
  body        text not null default '',
  report_id   uuid references public.reports(id) on delete cascade,
  location_id uuid references public.locations(id) on delete cascade,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (user_id) where read_at is null;

-- ------------------------------------------------------------------
-- Denormalised read model
--
-- Every list view needs report + upload + analysis + author + location. That
-- is a five-way join on every request; this view keeps the query planner's
-- work in one place and the application code in one shape.
-- ------------------------------------------------------------------

create or replace view public.report_details as
select
  r.id,
  r.title,
  r.description,
  r.observations,
  r.status,
  r.is_public,
  r.share_token,
  r.view_count,
  r.created_at,
  r.updated_at,
  r.user_id,
  r.location_id,
  u.id           as upload_id,
  u.image_url,
  u.thumbnail_url,
  u.captured_at,
  coalesce(u.latitude, l.latitude)   as latitude,
  coalesce(u.longitude, l.longitude) as longitude,
  a.id              as analysis_id,
  a.model,
  a.pollution_score,
  a.water_quality,
  a.clarity_score,
  a.confidence,
  a.detected_objects,
  a.pollution_tags,
  a.explanation,
  a.recommendations,
  a.indicators,
  a.is_simulated,
  a.created_at      as analysed_at,
  l.name            as location_name,
  l.slug            as location_slug,
  l.water_body_type,
  l.region,
  l.country,
  p.full_name       as author_name,
  p.avatar_url      as author_avatar,
  p.role            as author_role,
  p.points          as author_points,
  (select count(*) from public.comments c where c.report_id = r.id) as comment_count
from public.reports r
join public.uploads u      on u.id = r.upload_id
join public.ai_analysis a  on a.upload_id = u.id
join public.profiles p     on p.id = r.user_id
left join public.locations l on l.id = r.location_id;

-- ------------------------------------------------------------------
-- Aggregate helpers
-- ------------------------------------------------------------------

create or replace view public.location_stats as
select
  l.id                                        as location_id,
  l.name,
  l.slug,
  l.water_body_type,
  l.region,
  l.latitude,
  l.longitude,
  count(r.id)                                 as report_count,
  round(avg(a.pollution_score))::int          as avg_score,
  max(a.pollution_score)                      as worst_score,
  min(a.pollution_score)                      as best_score,
  max(r.created_at)                           as last_report_at
from public.locations l
left join public.reports r on r.location_id = l.id and r.status = 'approved'
left join public.ai_analysis a on a.upload_id = r.upload_id
group by l.id;

create or replace view public.leaderboard as
select
  p.id,
  p.full_name,
  p.avatar_url,
  p.role,
  p.points,
  count(distinct r.id)                        as report_count,
  count(distinct r.location_id)               as location_count,
  coalesce(round(avg(a.pollution_score))::int, 0) as avg_score,
  rank() over (order by p.points desc, count(distinct r.id) desc) as rank
from public.profiles p
left join public.reports r on r.user_id = p.id and r.status = 'approved'
left join public.ai_analysis a on a.upload_id = r.upload_id
group by p.id;

-- ------------------------------------------------------------------
-- Triggers
-- ------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists reports_touch on public.reports;
create trigger reports_touch before update on public.reports
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Mirror new auth users into profiles.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Award contribution points. Higher severity finds are worth more: they are
-- the reports that actually move environmental response.
create or replace function public.award_report_points()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  score int;
  award int;
begin
  select pollution_score into score
  from public.ai_analysis where upload_id = new.upload_id;

  award := 10 + coalesce(floor(score / 10.0)::int, 0) * 3;

  update public.profiles
     set points = points + award
   where id = new.user_id;

  return new;
end $$;

drop trigger if exists reports_award_points on public.reports;
create trigger reports_award_points after insert on public.reports
  for each row execute function public.award_report_points();

-- Fan out "new report nearby" notifications to opted-in users within radius.
create or replace function public.notify_nearby_users()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  rep_lat double precision;
  rep_lng double precision;
  score int;
  loc_name text;
begin
  select coalesce(u.latitude, l.latitude), coalesce(u.longitude, l.longitude),
         a.pollution_score, coalesce(l.name, 'an unnamed water body')
    into rep_lat, rep_lng, score, loc_name
    from public.uploads u
    join public.ai_analysis a on a.upload_id = u.id
    left join public.locations l on l.id = new.location_id
   where u.id = new.upload_id;

  if rep_lat is null or rep_lng is null then
    return new;
  end if;

  insert into public.notifications (user_id, kind, title, body, report_id, location_id)
  select
    p.id,
    case when score >= 81 then 'critical_trend'::notification_kind
         else 'nearby_report'::notification_kind end,
    case when score >= 81
         then 'Critical pollution reported near you'
         else 'New water report nearby' end,
    format('%s scored %s/100 — %s km from your monitoring area.',
           loc_name, score,
           round((6371 * acos(least(1, greatest(-1,
             cos(radians(p.home_latitude)) * cos(radians(rep_lat)) *
             cos(radians(rep_lng) - radians(p.home_longitude)) +
             sin(radians(p.home_latitude)) * sin(radians(rep_lat))
           ))))::numeric, 1)),
    new.id,
    new.location_id
  from public.profiles p
  where p.notify_nearby
    and p.id <> new.user_id
    and p.home_latitude is not null
    and p.home_longitude is not null
    and (6371 * acos(least(1, greatest(-1,
          cos(radians(p.home_latitude)) * cos(radians(rep_lat)) *
          cos(radians(rep_lng) - radians(p.home_longitude)) +
          sin(radians(p.home_latitude)) * sin(radians(rep_lat))
        )))) <= p.notify_radius_km;

  return new;
end $$;

drop trigger if exists reports_notify_nearby on public.reports;
create trigger reports_notify_nearby after insert on public.reports
  for each row execute function public.notify_nearby_users();

-- ------------------------------------------------------------------
-- Geospatial + trend RPCs
-- ------------------------------------------------------------------

-- Reports inside a bounding box. Called by the map on every pan/zoom, so it
-- must stay index-friendly: plain lat/lng range predicates, no PostGIS needed.
create or replace function public.reports_in_bounds(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision,
  max_rows integer default 2000
)
returns setof public.report_details
language sql stable as $$
  select * from public.report_details
   where status = 'approved'
     and is_public
     and latitude between min_lat and max_lat
     and longitude between min_lng and max_lng
   order by pollution_score desc
   limit max_rows;
$$;

-- Score time series for one location, feeding the trend engine.
create or replace function public.location_score_series(loc uuid)
returns table (
  report_id uuid,
  observed_at timestamptz,
  pollution_score int,
  water_quality water_quality,
  confidence int
)
language sql stable as $$
  select r.id,
         coalesce(u.captured_at, r.created_at),
         a.pollution_score,
         a.water_quality,
         a.confidence
    from public.reports r
    join public.uploads u     on u.id = r.upload_id
    join public.ai_analysis a on a.upload_id = u.id
   where r.location_id = loc
     and r.status = 'approved'
   order by coalesce(u.captured_at, r.created_at) asc;
$$;

create or replace function public.platform_stats()
returns json language sql stable as $$
  select json_build_object(
    'reports',      (select count(*) from public.reports where status = 'approved'),
    'locations',    (select count(*) from public.locations),
    'contributors', (select count(distinct user_id) from public.reports),
    'averageScore', (select coalesce(round(avg(pollution_score))::int, 0) from public.ai_analysis),
    'criticalCount',(select count(*) from public.ai_analysis where pollution_score >= 81),
    'analysedImages', (select count(*) from public.ai_analysis),
    'countries',    (select count(distinct country) from public.locations where country is not null)
  );
$$;
