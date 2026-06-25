import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus, Check, Search, Calendar, Edit2, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/caixa')({
  component: CaixaPage,
})

function CaixaPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ id: '', description: '', amount: '', due_date: new Date().toISOString().split('T')[0] })

  // Fetch Revenues (Installments)
  const { data: revenues, isLoading: loadingRevenues } = useQuery({
    queryKey: ['revenues_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('costume_installments').select('*')
      if (error) throw error
      return data || []
    }
  })

  // Fetch Expenses
  const { data: expenses, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('expenses').select('*').order('due_date', { ascending: true })
      if (error && error.code !== '42P01') throw error // 42P01 is table does not exist
      return data || []
    }
  })

  const parseMoneyValue = (val: string) => {
    if (!val) return 0
    return parseFloat(val.replace(/[R$\s\.]/g, '').replace(',', '.'))
  }

  const handleMoneyInput = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    let value = e.target.value.replace(/\D/g, '')
    if (!value) {
      setter('')
      return
    }
    const numberValue = parseInt(value, 10) / 100
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue)
    setter(formatted)
  }

  // Mutation to save an expense
  const saveExpenseMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        description: expenseForm.description,
        amount: parseMoneyValue(expenseForm.amount),
        due_date: expenseForm.due_date,
      }
      if (expenseForm.id) {
        const { error } = await supabase.from('expenses').update(payload).eq('id', expenseForm.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('expenses').insert([{ ...payload, status: 'Pendente' }])
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses_list'] })
      setIsExpenseModalOpen(false)
      setExpenseForm({ id: '', description: '', amount: '', due_date: new Date().toISOString().split('T')[0] })
    },
    onError: (err: any) => {
      alert(`Erro ao salvar despesa: ${err.message || 'Verifique sua conexão.'}`)
    }
  })

  // Mutation to pay an expense
  const payExpenseMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase
        .from('expenses')
        .update({ status, paid_at: status === 'Pago' ? new Date().toISOString() : null })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses_list'] })
    }
  })

  // Delete Expense
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses_list'] })
    }
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  // Calculate Summary
  const expectedRevenues = revenues?.reduce((acc: number, r: any) => acc + parseFloat(r.amount), 0) || 0
  const realizedRevenues = revenues?.filter((r: any) => r.status === 'Pago').reduce((acc: number, r: any) => acc + parseFloat(r.paid_amount || r.amount), 0) || 0
  
  const expectedExpenses = expenses?.reduce((acc: number, e: any) => acc + parseFloat(e.amount), 0) || 0
  const realizedExpenses = expenses?.filter((e: any) => e.status === 'Pago').reduce((acc: number, e: any) => acc + parseFloat(e.amount), 0) || 0

  const expectedBalance = expectedRevenues - expectedExpenses
  const currentBalance = realizedRevenues - realizedExpenses

  const filteredExpenses = expenses?.filter((e: any) => e.description.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveExpenseMutation.mutate()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif text-coxia-dark mb-1">Gestão Financeira Global</h1>
        <p className="text-gray-500">Resumo de receitas do festival e despesas operacionais.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Receitas</p>
              <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(realizedRevenues)}</h3>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
            Esperado total: <strong>{formatCurrency(expectedRevenues)}</strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger">
              <TrendingDown size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Despesas</p>
              <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(realizedExpenses)}</h3>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
            Previsto total: <strong>{formatCurrency(expectedExpenses)}</strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wallet size={20} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Saldo Atual (Caixa Real)</p>
              <h3 className={`text-3xl font-bold ${currentBalance >= 0 ? 'text-primary' : 'text-danger'}`}>{formatCurrency(currentBalance)}</h3>
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
            <span>Saldo Projetado ao final:</span>
            <span className={`font-bold ${expectedBalance >= 0 ? 'text-primary' : 'text-danger'}`}>{formatCurrency(expectedBalance)}</span>
          </div>
        </div>
      </div>

      {/* Expenses Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-xl font-serif text-gray-800">Custos Operacionais e Despesas</h2>
            <p className="text-sm text-gray-500">Locação, luz, som, equipe, etc.</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:flex-none flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Buscar despesa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-sm text-gray-700"
              />
            </div>
            <button 
              onClick={() => {
                setExpenseForm({ id: '', description: '', amount: '', due_date: new Date().toISOString().split('T')[0] })
                setIsExpenseModalOpen(true)
              }}
              className="bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-colors font-medium text-sm whitespace-nowrap"
            >
              <Plus size={18} /> Nova Despesa
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loadingExpenses ? (
             <div className="text-center py-8 text-gray-500">Carregando despesas...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-6 py-4 font-serif text-gray-700 font-medium">Descrição</th>
                  <th className="px-6 py-4 font-serif text-gray-700 font-medium">Vencimento</th>
                  <th className="px-6 py-4 font-serif text-gray-700 font-medium">Valor (R$)</th>
                  <th className="px-6 py-4 font-serif text-gray-700 font-medium">Status</th>
                  <th className="px-6 py-4 font-serif text-gray-700 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma despesa cadastrada ainda.</td>
                  </tr>
                )}
                {filteredExpenses?.map((expense: any) => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-800">{expense.description}</td>
                    <td className="px-6 py-4 text-gray-600 flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400"/>
                      {new Date(expense.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-800">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${expense.status === 'Pago' ? 'bg-success/10 text-success' : 'bg-warning-light text-warning-dark'}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        {expense.status === 'Pendente' ? (
                          <button 
                            onClick={() => payExpenseMutation.mutate({ id: expense.id, status: 'Pago' })}
                            className="p-2 bg-success/10 text-success hover:bg-success hover:text-white rounded-lg transition-colors"
                            title="Dar Baixa"
                          >
                            <Check size={16} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => payExpenseMutation.mutate({ id: expense.id, status: 'Pendente' })}
                            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-xs font-bold px-3"
                            title="Reverter Baixa"
                          >
                            Reverter
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setExpenseForm({ id: expense.id, description: expense.description, amount: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.amount), due_date: expense.due_date })
                            setIsExpenseModalOpen(true)
                          }}
                          className="p-2 text-gray-400 hover:text-primary bg-gray-50 hover:bg-primary/10 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if(confirm(`Tem certeza que deseja excluir a despesa: ${expense.description}?`)) {
                              deleteExpenseMutation.mutate(expense.id)
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-danger bg-gray-50 hover:bg-danger/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Nova Despesa */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-serif text-coxia-dark mb-4">{expenseForm.id ? 'Editar Despesa' : 'Nova Despesa'}</h2>
            
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input 
                  type="text" 
                  required
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                  placeholder="Ex: Locação de Iluminação"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                  <input 
                    type="text" 
                    required
                    value={expenseForm.amount}
                    onChange={e => handleMoneyInput(e, val => setExpenseForm({...expenseForm, amount: val}))}
                    placeholder="R$ 0,00"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                  <input 
                    type="date" 
                    required
                    value={expenseForm.due_date}
                    onChange={e => setExpenseForm({...expenseForm, due_date: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saveExpenseMutation.isPending}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 font-medium disabled:opacity-50"
                >
                  {saveExpenseMutation.isPending ? 'Salvando...' : 'Salvar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
