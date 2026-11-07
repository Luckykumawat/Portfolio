-- Create your owner account in Supabase Authentication > Users first.
-- Owner email confirmed by the portfolio owner. Run once in the trusted SQL Editor.
-- No frontend user can grant themselves admin access.
insert into public.portfolio_admins(user_id)
select id from auth.users where lower(email) = lower('okuma.jaipur@gmail.com')
on conflict(user_id) do update set enabled=true;
