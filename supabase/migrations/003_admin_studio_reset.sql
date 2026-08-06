-- H&S Studio: melhorias administrativas seguras e não destrutivas.
-- Execute uma vez no SQL Editor do Supabase depois de criar um backup.

begin;

create or replace function public.delete_zero_result_searches(p_query text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  delete from public.search_events
  where results_count = 0
    and (
      p_query is null
      or lower(trim(query)) = lower(trim(p_query))
    );

  get diagnostics deleted_count = row_count;

  insert into public.admin_activity_logs(
    actor_id,
    action,
    entity_type,
    entity_id,
    summary,
    metadata
  ) values (
    auth.uid(),
    'delete_zero_result_searches',
    'search_events',
    null,
    case
      when p_query is null then 'Limpou todas as buscas sem resultado'
      else 'Removeu o termo sem resultado: ' || p_query
    end,
    jsonb_build_object(
      'query', p_query,
      'deleted_count', deleted_count
    )
  );

  return deleted_count;
end;
$$;

revoke all on function public.delete_zero_result_searches(text) from public;
grant execute on function public.delete_zero_result_searches(text) to authenticated;

create index if not exists search_events_zero_results_idx
  on public.search_events (searched_at desc)
  where results_count = 0;

commit;
