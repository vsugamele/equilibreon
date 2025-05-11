-- Função para verificar se uma tabela existe no banco de dados
create or replace function public.check_table_exists(tablename text)
returns boolean
language plpgsql security definer
as $$
begin
  return exists (
    select from information_schema.tables 
    where table_schema = 'public'
    and table_name = tablename
  );
end;
$$;

-- Função para obter colunas de uma tabela
create or replace function public.get_columns(table_name text)
returns table (column_name text, data_type text)
language plpgsql security definer
as $$
begin
  return query
    select c.column_name::text, c.data_type::text
    from information_schema.columns c
    where c.table_schema = 'public'
    and c.table_name = table_name;
end;
$$;

-- Conceder acesso a todos os usuários autenticados
grant execute on function public.check_table_exists(text) to authenticated;
grant execute on function public.get_columns(text) to authenticated;
