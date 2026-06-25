import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Plus, CheckCircle, Clock, Search, ChevronDown, ChevronUp, Check, DollarSign } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/pagamentos')({
  component: PagamentosPage,
})

function PagamentosPage() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedDancer, setExpandedDancer] = useState<string | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedDancerForAssign, setSelectedDancerForAssign] = useState<any>(null)
  
  const [assignForm, setAssignForm] = useState({
    selectedCostumes: [] as any[],
    discount: 0,
    total_value: '',
    installments_count: 1,
    initial_due_date: new Date().toISOString().split('T')[0]
  })

  const [payModal, setPayModal] = useState<{isOpen: boolean, installment: any}>({ isOpen: false, installment: null })
  const [payForm, setPayForm] = useState({
    paid_at: new Date().toISOString().split('T')[0],
    paid_amount: ''
  })

  // Fetch costumes
  const { data: costumes } = useQuery({
    queryKey: ['costumes_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('costumes').select('*').order('name')
      if (error) throw error
      return data
    }
  })

  // Fetch all dancers with their assignments and installments
  const { data: dancers, isLoading, isError, error: dancersError } = useQuery({
    queryKey: ['dancers_finance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dancers')
        .select(`
          id, name,
          costume_assignments (
          costume_assignments (
            id, costume_name, total_value, installments_count, created_at,
            costume_installments (
              id, installment_number, amount, due_date, status, paid_at, paid_amount
            )
          )
        `)
        .order('name')
      if (error) throw error
      
      // Sort installments inside assignments
      data?.forEach(dancer => {
        dancer.costume_assignments?.forEach((assignment: any) => {
          assignment.costume_installments?.sort((a: any, b: any) => a.installment_number - b.installment_number)
        })
      })
      
      return data
    }
  })

  // Mutation to Assign Costume and create installments
  const assignMutation = useMutation({
    mutationFn: async () => {
      const totalValue = parseFloat(assignForm.total_value)
      if (isNaN(totalValue)) throw new Error("Valor total inválido")

      // 1. Create Assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('costume_assignments')
        .insert([{
          dancer_id: selectedDancerForAssign.id,
          costume_name: assignForm.selectedCostumes.map(c => c.name).join(', '),
          total_value: totalValue,
          installments_count: assignForm.installments_count
        }])
        .select()
        .single()
        
      if (assignmentError) throw assignmentError

      // 2. Create Installments
      const amountPerInstallment = totalValue / assignForm.installments_count
      const installments = []
      
      for (let i = 1; i <= assignForm.installments_count; i++) {
        // Use the initial due date
        const dueDate = new Date(assignForm.initial_due_date)
        dueDate.setUTCMonth(dueDate.getUTCMonth() + i - 1)
        
        installments.push({
          assignment_id: assignmentData.id,
          installment_number: i,
          amount: amountPerInstallment,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'Pendente'
        })
      }

      const { error: installmentsError } = await supabase
        .from('costume_installments')
        .insert(installments)

      if (installmentsError) throw installmentsError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dancers_finance'] })
      setIsAssignModalOpen(false)
      setAssignForm({ selectedCostumes: [], discount: 0, total_value: '', installments_count: 1, initial_due_date: new Date().toISOString().split('T')[0] })
    }
  })

  // Mutation to pay an installment
  const payMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('costume_installments')
        .update({ 
          status: 'Pago', 
          paid_at: new Date(payForm.paid_at).toISOString(),
          paid_amount: parseFloat(payForm.paid_amount)
        })
        .eq('id', payModal.installment.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dancers_finance'] })
      setPayModal({ isOpen: false, installment: null })
    }
  })

  const filteredDancers = dancers?.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const toggleExpand = (id: string) => {
    setExpandedDancer(prev => prev === id ? null : id)
  }

  const openAssignModal = (dancer: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedDancerForAssign(dancer)
    setAssignForm({ selectedCostumes: [], discount: 0, total_value: '', installments_count: 1, initial_due_date: new Date().toISOString().split('T')[0] })
    setIsAssignModalOpen(true)
  }

  const handleCostumeToggle = (costume: any) => {
    setAssignForm(prev => {
      const isSelected = prev.selectedCostumes.find(c => c.id === costume.id)
      let newSelected = []
      if (isSelected) {
        newSelected = prev.selectedCostumes.filter(c => c.id !== costume.id)
      } else {
        newSelected = [...prev.selectedCostumes, costume]
      }
      
      // Auto sum prices
      const sum = newSelected.reduce((acc, c) => acc + (parseFloat(c.price) || 0), 0)
      const discountedSum = sum * (1 - prev.discount / 100)
      
      return {
        ...prev,
        selectedCostumes: newSelected,
        total_value: discountedSum > 0 ? discountedSum.toFixed(2) : ''
      }
    })
  }

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0
    setAssignForm(prev => {
      const sum = prev.selectedCostumes.reduce((acc, c) => acc + (parseFloat(c.price) || 0), 0)
      const discountedSum = sum * (1 - val / 100)
      return {
        ...prev,
        discount: val,
        total_value: discountedSum > 0 ? discountedSum.toFixed(2) : ''
      }
    })
  }

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    assignMutation.mutate()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Financeiro: Figurinos</h1>
          <p className="text-gray-500">Controle de pagamento e parcelamento de figurinos por aluno.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 mb-6">
          <Search size={20} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-gray-700"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Carregando dados financeiros...</div>
        ) : isError ? (
          <div className="text-center py-12 px-4 rounded-xl border border-danger/20 bg-danger/5">
            <h3 className="text-danger font-bold text-lg mb-2">Erro de Sincronização!</h3>
            <p className="text-danger-dark mb-4 max-w-lg mx-auto">
              O sistema não conseguiu carregar os dados. Isso geralmente acontece se o banco de dados não foi atualizado com a última versão.
            </p>
            <p className="text-sm font-medium text-danger/80">
              Por favor, certifique-se de executar o script <strong>sql_financeiro_v4.sql</strong> no Supabase.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDancers?.map(dancer => {
              const totalAssignments = dancer.costume_assignments?.length || 0
              const allInstallments = dancer.costume_assignments?.flatMap((a: any) => a.costume_installments) || []
              const pendingInstallments = allInstallments.filter((i: any) => i.status === 'Pendente')
              const hasPending = pendingInstallments.length > 0

              return (
                <div key={dancer.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                  {/* Dancer Row Header */}
                  <div 
                    onClick={() => toggleExpand(dancer.id)}
                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                        {dancer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{dancer.name}</h3>
                        <p className="text-sm text-gray-500">
                          {totalAssignments === 0 ? 'Sem figurinos' : `${totalAssignments} figurino(s)`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {totalAssignments > 0 && (
                        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${hasPending ? 'bg-warning-light text-warning-dark' : 'bg-success/10 text-success'}`}>
                          {hasPending ? <Clock size={14}/> : <CheckCircle size={14}/>}
                          {hasPending ? `${pendingInstallments.length} parcela(s) pendente(s)` : 'Tudo Pago'}
                        </div>
                      )}
                      <button 
                        onClick={(e) => openAssignModal(dancer, e)}
                        className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1"
                      >
                        <Plus size={16} /> Vincular
                      </button>
                      {expandedDancer === dancer.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedDancer === dancer.id && (
                    <div className="p-6 bg-white border-t border-gray-200">
                      {totalAssignments === 0 ? (
                        <p className="text-gray-500 text-center py-4">Nenhum figurino vinculado a este aluno ainda.</p>
                      ) : (
                        <div className="space-y-8">
                          {dancer.costume_assignments?.map((assignment: any) => (
                            <div key={assignment.id} className="border border-gray-100 rounded-xl p-5 bg-gray-50/50">
                              <div className="flex justify-between items-center mb-4">
                                <div>
                                  <h4 className="font-bold text-lg text-gray-800">{assignment.costume_name || 'Figurino Desconhecido'}</h4>
                                  <p className="text-sm text-gray-500">Valor Total: {formatCurrency(assignment.total_value)}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {assignment.costume_installments?.map((inst: any) => (
                                  <div key={inst.id} className={`p-4 rounded-xl border ${inst.status === 'Pago' ? 'bg-success/5 border-success/20' : 'bg-white border-gray-200 shadow-sm'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                      <span className="text-sm font-bold text-gray-600">Parcela {inst.installment_number}/{assignment.installments_count}</span>
                                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${inst.status === 'Pago' ? 'bg-success/20 text-success' : 'bg-warning-light text-warning-dark'}`}>
                                        {inst.status}
                                      </span>
                                    </div>
                                    <div className="text-xl font-bold text-gray-800 mb-1">{formatCurrency(inst.amount)}</div>
                                    <div className="text-xs text-gray-500 mb-4">
                                      Vencimento: {new Date(inst.due_date).toLocaleDateString('pt-BR')}
                                    </div>
                                    
                                    {inst.status === 'Pendente' ? (
                                      <button 
                                        onClick={() => {
                                          setPayModal({ isOpen: true, installment: inst })
                                          setPayForm({ paid_at: new Date().toISOString().split('T')[0], paid_amount: inst.amount.toString() })
                                        }}
                                        className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors py-2 rounded-lg text-sm font-medium"
                                      >
                                        <DollarSign size={16} /> Dar Baixa
                                      </button>
                                    ) : (
                                      <div className="w-full flex flex-col items-center justify-center gap-1 text-success py-2 text-sm font-medium">
                                        <div className="flex items-center gap-1"><Check size={16} /> Pago em {new Date(inst.paid_at).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
                                        <span className="text-xs text-gray-500 font-normal">Valor pago: {formatCurrency(inst.paid_amount || inst.amount)}</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Vincular Figurino */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-serif text-coxia-dark mb-2">Vincular Figurino</h2>
            <p className="text-sm text-gray-500 mb-6">Aluno: <strong className="text-gray-800">{selectedDancerForAssign?.name}</strong></p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selecione 1 ou mais Figurinos</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50">
                  {costumes?.length === 0 && <p className="text-sm text-gray-500">Nenhum figurino cadastrado.</p>}
                  {costumes?.map(c => (
                    <label key={c.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={assignForm.selectedCostumes.some(sc => sc.id === c.id)}
                        onChange={() => handleCostumeToggle(c)}
                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <span className="text-sm text-gray-800 flex-1">{c.name}</span>
                      <span className="text-sm font-bold text-gray-600">{c.price ? formatCurrency(c.price) : 'Sem valor'}</span>
                    </label>
                  ))}
                </div>
                {assignForm.selectedCostumes.length === 0 && (
                  <p className="text-xs text-danger mt-1">Selecione pelo menos um figurino.</p>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data 1ª Parcela</label>
                  <input 
                    type="date" 
                    required
                    value={assignForm.initial_due_date}
                    onChange={e => setAssignForm({...assignForm, initial_due_date: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex-[0.5]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="100"
                    value={assignForm.discount}
                    onChange={handleDiscountChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex-[0.8]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    value={assignForm.total_value}
                    onChange={e => setAssignForm({...assignForm, total_value: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Ex: 150.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Parcelas</label>
                <select 
                  value={assignForm.installments_count}
                  onChange={e => setAssignForm({...assignForm, installments_count: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {[1,2,3,4,5,6].map(num => (
                    <option key={num} value={num}>{num}x</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  * As datas de vencimento serão geradas automaticamente (mensais).
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAssignModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={assignMutation.isPending || assignForm.selectedCostumes.length === 0}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 font-medium disabled:opacity-50"
                >
                  {assignMutation.isPending ? 'Salvando...' : 'Vincular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dar Baixa */}
      {payModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-serif text-coxia-dark mb-4">Confirmar Pagamento</h2>
            
            <form onSubmit={(e) => { e.preventDefault(); payMutation.mutate() }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data do Pagamento</label>
                <input 
                  type="date" 
                  required
                  value={payForm.paid_at}
                  onChange={e => setPayForm({...payForm, paid_at: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor Recebido (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={payForm.paid_amount}
                  onChange={e => setPayForm({...payForm, paid_amount: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setPayModal({isOpen: false, installment: null})}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={payMutation.isPending}
                  className="flex-1 bg-success text-white px-4 py-2 rounded-xl hover:bg-success/90 font-medium disabled:opacity-50"
                >
                  {payMutation.isPending ? 'Salvando...' : 'Dar Baixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
