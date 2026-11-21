-- Keep each tenant to exactly one server-side administrator account.
-- This removes stale administrator rows that can accidentally grant the
-- platform Super User role to a second auth account.

delete from public.admins a
using auth.users u
where a.user_id = u.id
  and a.tenant_id = 'investec'
  and lower(u.email) <> 'andresnell29@gmail.com';

delete from public.admins a
using auth.users u
where a.user_id = u.id
  and a.tenant_id = 'discovery'
  and lower(u.email) <> 'ad4snell@gmail.com';

insert into public.admins (user_id, tenant_id)
select u.id, 'investec'
from auth.users u
where lower(u.email) = 'andresnell29@gmail.com'
on conflict (user_id) do update set tenant_id = excluded.tenant_id;

insert into public.admins (user_id, tenant_id)
select u.id, 'discovery'
from auth.users u
where lower(u.email) = 'ad4snell@gmail.com'
on conflict (user_id) do update set tenant_id = excluded.tenant_id;

create or replace function public.ensure_single_super_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  account_email text;
begin
  select lower(email) into account_email
  from auth.users
  where id = new.user_id;

  if (new.tenant_id = 'investec' and account_email = 'andresnell29@gmail.com')
     or (new.tenant_id = 'discovery' and account_email = 'ad4snell@gmail.com') then
    return new;
  end if;

  raise exception 'Only the designated super-user account can be an administrator';
end;
$$;

drop trigger if exists admins_single_super_user on public.admins;
create trigger admins_single_super_user
before insert or update of user_id, tenant_id on public.admins
for each row execute function public.ensure_single_super_user();
