## Regras do Banco de Dados (Supabase)
- **Sempre desabilitar RLS:** Ao criar uma nova tabela no Supabase por meio de scripts SQL, **SEMPRE** inclua o comando `ALTER TABLE public.<nome_da_tabela> DISABLE ROW LEVEL SECURITY;`. O usuário explicitamente pediu para que as políticas de segurança sempre sejam liberadas durante o desenvolvimento.
