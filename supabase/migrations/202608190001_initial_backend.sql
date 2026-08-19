-- CorpSignal Supabase backend
-- Identity: Supabase Auth
-- Authorization: profiles + RLS + guarded use-case functions
-- Media metadata: Postgres; binary objects: Cloudflare R2 through Edge Functions

create extension if not exists citext with schema extensions;

do $$
begin
  create type public.app_role as enum ('Member', 'Admin', 'Manager');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username extensions.citext not null unique,
  role public.app_role not null default 'Member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format
    check (username::text ~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,49}$')
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  body_html text not null,
  priority smallint not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_by_username text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_priority_range check (priority between 0 and 2),
  constraint posts_body_size check (length(body_html) between 1 and 100000)
);

create table if not exists public.read_receipts (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  constraint read_receipts_post_user_unique unique (post_id, user_id)
);

create table if not exists public.media_assets (
  id uuid primary key,
  object_key text not null unique,
  public_url text not null,
  original_name text not null,
  content_type text not null,
  file_size bigint not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint media_assets_content_type
    check (content_type in ('image/jpeg', 'image/png', 'image/gif', 'image/webp')),
  constraint media_assets_file_size check (file_size between 1 and 10485760)
);

create table if not exists public.post_assets (
  post_id uuid not null references public.posts(id) on delete cascade,
  asset_id uuid not null references public.media_assets(id) on delete cascade,
  attached_at timestamptz not null default now(),
  primary key (post_id, asset_id),
  constraint post_assets_one_post_per_asset unique (asset_id)
);

create index if not exists posts_created_at_desc_idx on public.posts(created_at desc);
create index if not exists posts_priority_created_at_idx on public.posts(priority, created_at desc);
create index if not exists read_receipts_user_id_idx on public.read_receipts(user_id);
create index if not exists media_assets_uploaded_by_idx on public.media_assets(uploaded_by, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
before update on public.posts
for each row execute function public.touch_updated_at();

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_username text;
  profile_role public.app_role;
begin
  profile_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );

  if profile_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,49}$' then
    raise exception using message = 'Invalid username metadata', errcode = '22023';
  end if;

  profile_role := case
    when new.raw_app_meta_data ->> 'role' in ('Member', 'Admin', 'Manager')
      then (new.raw_app_meta_data ->> 'role')::public.app_role
    else 'Member'::public.app_role
  end;

  insert into public.profiles (id, username, role)
  values (new.id, profile_username, profile_role);

  return new;
end;
$$;

create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_username text;
  profile_role public.app_role;
begin
  profile_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );

  if profile_username !~ '^[A-Za-z0-9][A-Za-z0-9._-]{2,49}$' then
    raise exception using message = 'Invalid username metadata', errcode = '22023';
  end if;

  profile_role := case
    when new.raw_app_meta_data ->> 'role' in ('Member', 'Admin', 'Manager')
      then (new.raw_app_meta_data ->> 'role')::public.app_role
    else 'Member'::public.app_role
  end;

  update public.profiles
  set username = profile_username,
      role = profile_role
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email, raw_user_meta_data, raw_app_meta_data on auth.users
for each row execute function public.handle_auth_user_updated();

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.can_manage_posts()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_role() in ('Admin', 'Manager'), false)
$$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_role() = 'Manager', false)
$$;

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.read_receipts enable row level security;
alter table public.media_assets enable row level security;
alter table public.post_assets enable row level security;

drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists posts_read_authenticated on public.posts;
create policy posts_read_authenticated
on public.posts for select
to authenticated
using (auth.uid() is not null);

drop policy if exists receipts_read_own on public.read_receipts;
create policy receipts_read_own
on public.read_receipts for select
to authenticated
using (user_id = auth.uid());

drop policy if exists media_assets_read_authorized on public.media_assets;
create policy media_assets_read_authorized
on public.media_assets for select
to authenticated
using (uploaded_by = auth.uid() or public.can_manage_posts());

drop policy if exists post_assets_read_authenticated on public.post_assets;
create policy post_assets_read_authenticated
on public.post_assets for select
to authenticated
using (auth.uid() is not null);

create or replace function public.post_payload(p_post_id uuid, p_viewer_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p.id,
    'body', p.body_html,
    'priority', case p.priority when 0 then 'Low' when 1 then 'Medium' else 'High' end,
    'priorityLevel', p.priority,
    'createdByUsername', coalesce(author.username::text, p.created_by_username),
    'createdById', p.created_by,
    'createdAt', p.created_at,
    'updatedAt', p.updated_at,
    'isRead', exists (
      select 1 from public.read_receipts rr
      where rr.post_id = p.id and rr.user_id = p_viewer_id
    ),
    'readCount', case when public.can_manage_posts() then (
      select count(*) from public.read_receipts rr where rr.post_id = p.id
    ) else 0 end,
    'totalUsers', case when public.can_manage_posts() then (
      select count(*) from public.profiles
    ) else 0 end
  )
  from public.posts p
  left join public.profiles author on author.id = p.created_by
  where p.id = p_post_id
$$;

create or replace function public.get_posts(
  p_page integer default 1,
  p_page_size integer default 20,
  p_priority integer default null,
  p_search text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  viewer_id uuid := auth.uid();
  safe_page integer := greatest(coalesce(p_page, 1), 1);
  safe_page_size integer := least(greatest(coalesce(p_page_size, 20), 1), 100);
  normalized_search text := nullif(trim(coalesce(p_search, '')), '');
  total_count integer;
  post_items jsonb;
begin
  if viewer_id is null then
    raise exception using message = 'Authentication required', errcode = '42501';
  end if;

  if p_priority is not null and p_priority not between 0 and 2 then
    raise exception using message = 'Priority must be between 0 and 2', errcode = '22023';
  end if;

  if length(coalesce(normalized_search, '')) > 200 then
    raise exception using message = 'Search text is too long', errcode = '22023';
  end if;

  select count(*)
  into total_count
  from public.posts p
  where (p_priority is null or p.priority = p_priority)
    and (normalized_search is null or position(lower(normalized_search) in lower(p.body_html)) > 0);

  select coalesce(
    jsonb_agg(public.post_payload(page_rows.id, viewer_id) order by page_rows.created_at desc),
    '[]'::jsonb
  )
  into post_items
  from (
    select p.id, p.created_at
    from public.posts p
    where (p_priority is null or p.priority = p_priority)
      and (normalized_search is null or position(lower(normalized_search) in lower(p.body_html)) > 0)
    order by p.created_at desc
    offset ((safe_page - 1) * safe_page_size)
    limit safe_page_size
  ) page_rows;

  return jsonb_build_object(
    'data', post_items,
    'pagination', jsonb_build_object(
      'page', safe_page,
      'pageSize', safe_page_size,
      'totalCount', total_count,
      'totalPages', case
        when total_count = 0 then 0
        else ceil(total_count::numeric / safe_page_size)::integer
      end
    )
  );
end;
$$;

create or replace function public.get_post(p_post_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  payload jsonb;
begin
  if auth.uid() is null then
    raise exception using message = 'Authentication required', errcode = '42501';
  end if;

  payload := public.post_payload(p_post_id, auth.uid());
  if payload is null then
    raise exception using message = 'Post not found', errcode = 'P0002';
  end if;

  return payload;
end;
$$;

create or replace function public.create_post(
  p_body text,
  p_priority integer,
  p_asset_ids uuid[] default '{}'::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  actor_username text;
  new_post_id uuid;
  asset_ids uuid[];
begin
  if actor_id is null or not public.can_manage_posts() then
    raise exception using message = 'Manager or Admin role required', errcode = '42501';
  end if;

  if length(trim(coalesce(p_body, ''))) = 0 or length(p_body) > 100000 then
    raise exception using message = 'Post content is required and must be under 100,000 characters', errcode = '22023';
  end if;

  if p_priority is null or p_priority not between 0 and 2 then
    raise exception using message = 'Priority must be between 0 and 2', errcode = '22023';
  end if;

  select coalesce(array_agg(distinct asset_id), '{}'::uuid[])
  into asset_ids
  from unnest(coalesce(p_asset_ids, '{}'::uuid[])) as requested(asset_id);

  if exists (
    select 1
    from unnest(asset_ids) requested(id)
    left join public.media_assets asset on asset.id = requested.id
    where asset.id is null
       or asset.uploaded_by is distinct from actor_id
       or exists (select 1 from public.post_assets linked where linked.asset_id = requested.id)
  ) then
    raise exception using message = 'One or more images are invalid or already attached', errcode = '22023';
  end if;

  select username::text into actor_username from public.profiles where id = actor_id;

  insert into public.posts (body_html, priority, created_by, created_by_username)
  values (p_body, p_priority, actor_id, actor_username)
  returning id into new_post_id;

  insert into public.post_assets (post_id, asset_id)
  select new_post_id, asset_id from unnest(asset_ids) as requested(asset_id);

  return public.post_payload(new_post_id, actor_id);
end;
$$;

create or replace function public.update_post(
  p_post_id uuid,
  p_body text,
  p_priority integer,
  p_asset_ids uuid[] default '{}'::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  asset_ids uuid[];
  detached_asset_ids uuid[];
begin
  if actor_id is null or not public.can_manage_posts() then
    raise exception using message = 'Manager or Admin role required', errcode = '42501';
  end if;

  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception using message = 'Post not found', errcode = 'P0002';
  end if;

  if length(trim(coalesce(p_body, ''))) = 0 or length(p_body) > 100000 then
    raise exception using message = 'Post content is required and must be under 100,000 characters', errcode = '22023';
  end if;

  if p_priority is null or p_priority not between 0 and 2 then
    raise exception using message = 'Priority must be between 0 and 2', errcode = '22023';
  end if;

  select coalesce(array_agg(distinct asset_id), '{}'::uuid[])
  into asset_ids
  from unnest(coalesce(p_asset_ids, '{}'::uuid[])) as requested(asset_id);

  if exists (
    select 1
    from unnest(asset_ids) requested(id)
    left join public.media_assets asset on asset.id = requested.id
    where asset.id is null
       or (
         asset.uploaded_by is distinct from actor_id
         and not exists (
           select 1 from public.post_assets current_link
           where current_link.asset_id = requested.id and current_link.post_id = p_post_id
         )
       )
       or exists (
         select 1 from public.post_assets other_link
         where other_link.asset_id = requested.id and other_link.post_id <> p_post_id
       )
  ) then
    raise exception using message = 'One or more images are invalid or attached to another post', errcode = '22023';
  end if;

  update public.posts
  set body_html = p_body,
      priority = p_priority
  where id = p_post_id;

  select coalesce(array_agg(asset_id), '{}'::uuid[])
  into detached_asset_ids
  from public.post_assets
  where post_id = p_post_id
    and not (asset_id = any(asset_ids));

  delete from public.post_assets
  where post_id = p_post_id
    and not (asset_id = any(asset_ids));

  insert into public.post_assets (post_id, asset_id)
  select p_post_id, asset_id from unnest(asset_ids) as requested(asset_id)
  on conflict do nothing;

  return public.post_payload(p_post_id, actor_id)
    || jsonb_build_object('detachedAssetIds', to_jsonb(detached_asset_ids));
end;
$$;

create or replace function public.delete_post(p_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  asset_ids uuid[];
begin
  if auth.uid() is null or not public.can_manage_posts() then
    raise exception using message = 'Manager or Admin role required', errcode = '42501';
  end if;

  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception using message = 'Post not found', errcode = 'P0002';
  end if;

  select coalesce(array_agg(asset_id), '{}'::uuid[])
  into asset_ids
  from public.post_assets
  where post_id = p_post_id;

  delete from public.posts where id = p_post_id;

  return jsonb_build_object('assetIds', to_jsonb(asset_ids));
end;
$$;

create or replace function public.mark_post_read(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    raise exception using message = 'Authentication required', errcode = '42501';
  end if;

  if not exists (select 1 from public.posts where id = p_post_id) then
    raise exception using message = 'Post not found', errcode = 'P0002';
  end if;

  insert into public.read_receipts (post_id, user_id)
  values (p_post_id, actor_id)
  on conflict (post_id, user_id) do nothing;

  return true;
end;
$$;

create or replace function public.get_post_receipts(p_post_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  receipts jsonb;
begin
  if auth.uid() is null or not public.can_manage_posts() then
    raise exception using message = 'Manager or Admin role required', errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', receipt.id,
        'postId', receipt.post_id,
        'userId', receipt.user_id,
        'username', profile.username::text,
        'readAt', receipt.read_at
      ) order by receipt.read_at desc
    ),
    '[]'::jsonb
  )
  into receipts
  from public.read_receipts receipt
  join public.profiles profile on profile.id = receipt.user_id
  where receipt.post_id = p_post_id;

  return receipts;
end;
$$;

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;

grant select on public.profiles, public.posts, public.read_receipts, public.media_assets, public.post_assets
to authenticated;

revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.handle_auth_user_created() from public, anon, authenticated;
revoke all on function public.handle_auth_user_updated() from public, anon, authenticated;
revoke all on function public.post_payload(uuid, uuid) from public, anon, authenticated;

revoke all on function public.current_role() from public, anon;
revoke all on function public.can_manage_posts() from public, anon;
revoke all on function public.is_manager() from public, anon;
revoke all on function public.get_posts(integer, integer, integer, text) from public, anon;
revoke all on function public.get_post(uuid) from public, anon;
revoke all on function public.create_post(text, integer, uuid[]) from public, anon;
revoke all on function public.update_post(uuid, text, integer, uuid[]) from public, anon;
revoke all on function public.delete_post(uuid) from public, anon;
revoke all on function public.mark_post_read(uuid) from public, anon;
revoke all on function public.get_post_receipts(uuid) from public, anon;

grant execute on function public.current_role() to authenticated;
grant execute on function public.can_manage_posts() to authenticated;
grant execute on function public.is_manager() to authenticated;
grant execute on function public.get_posts(integer, integer, integer, text) to authenticated;
grant execute on function public.get_post(uuid) to authenticated;
grant execute on function public.create_post(text, integer, uuid[]) to authenticated;
grant execute on function public.update_post(uuid, text, integer, uuid[]) to authenticated;
grant execute on function public.delete_post(uuid) to authenticated;
grant execute on function public.mark_post_read(uuid) to authenticated;
grant execute on function public.get_post_receipts(uuid) to authenticated;
