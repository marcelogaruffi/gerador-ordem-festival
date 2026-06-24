export function getFriendlyErrorMessage(error: any): string {
  if (!error) return 'Ocorreu um erro inesperado e silencioso. (Código: ERR-000)'

  // Captura o código padrão do PostgreSQL/Supabase ou gera um genérico
  const code = error.code || 'ERR-001'
  const msg = error.message?.toLowerCase() || ''

  // Mapeamento de erros técnicos para humano
  if (code === 'PGRST116') return `Nenhum dado encontrado para esta busca. (Código: ${code})`
  if (code === 'PGRST205') return `O banco de dados ainda não sincronizou a nova tabela. Aguarde alguns segundos ou recarregue a página. (Código: ${code})`
  if (code === 'PGRST204') return `Coluna ou tabela não encontrada no banco de dados. Detalhe: ${msg} (Código: ${code})`
  if (msg.includes('row-level security') || code === '42501') {
    return `Permissão negada no Banco de Dados. O acesso à tabela está bloqueado por políticas de segurança. (Código: ${code})`
  }
  if (msg.includes('foreign key constraint') || code === '23503') {
    return `Vínculo inválido. Você está tentando salvar algo relacionado a um item (como um Festival) que não existe ou foi apagado. (Código: ${code})`
  }
  if (msg.includes('unique constraint') || code === '23505') {
    return `Já existe um cadastro com essa mesma informação exclusiva (ex: Código ou Nome). Tente usar outro. (Código: ${code})`
  }
  if (msg.includes('not null violation') || code === '23502') {
    return `Um campo obrigatório não foi preenchido corretamente ou foi enviado vazio. (Código: ${code})`
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) {
    return `Falha de conexão. O sistema não conseguiu se comunicar com a nuvem. Verifique sua internet. (Código: NET-001)`
  }

  // Fallback padrão
  return `Ocorreu um erro no servidor ao processar sua requisição. (Código: ${code})`
}
