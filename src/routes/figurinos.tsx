import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Plus, Search, Filter, Image as ImageIcon, Edit2, Trash2, X, Music } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/figurinos')({
  component: FigurinosPage,
})

function FigurinosPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'catalogo' | 'entregas'>('catalogo')
  const [formData, setFormData] = useState({ name: '', description: '', image_url: '', price: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [notesModal, setNotesModal] = useState<{isOpen: boolean, id: string, notes: string}>({isOpen: false, id: '', notes: ''})

  const { data: costumes, isLoading } = useQuery({
    queryKey: ['costumes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('costumes')
        .select(`
          *,
          choreography_costumes ( count )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  // Fetch das Entregas
  const { data: deliveries, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('costume_assignments')
        .select(`id, costume_name, delivered, delivered_at, notes, dancers ( name )`)
      if (error) throw error
      return data
    },
    enabled: activeTab === 'entregas'
  })

  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ id, delivered, notes }: { id: string, delivered?: boolean, notes?: string }) => {
      const updateData: any = {}
      if (delivered !== undefined) updateData.delivered = delivered
      if (notes !== undefined) updateData.notes = notes
      
      const { error } = await supabase.from('costume_assignments').update(updateData).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
    }
  })

  const insertMutation = useMutation({
    mutationFn: async (newCostume: typeof formData) => {
      const { data, error } = await supabase.from('costumes').insert([newCostume]).select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costumes'] })
      closeModal()
    },
    onError: (error: any) => {
      alert(`Erro ao cadastrar: ${error.message || error}`)
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (updatedCostume: typeof formData) => {
      if (!editingId) return
      const { data, error } = await supabase.from('costumes').update(updatedCostume).eq('id', editingId).select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costumes'] })
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('costumes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['costumes'] })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) updateMutation.mutate(formData)
    else insertMutation.mutate(formData)
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Excluir o figurino "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const openEditModal = (costume: any) => {
    setEditingId(costume.id)
    setFormData({ name: costume.name, description: costume.description || '', image_url: costume.image_url || '', price: costume.price ? costume.price.toString() : '' })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({ name: '', description: '', image_url: '', price: '' })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('images').upload(fileName, file)
      
      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('images').getPublicUrl(fileName)
      setFormData(prev => ({ ...prev, image_url: data.publicUrl }))
    } catch (err: any) {
      alert(`Erro no upload: ${err.message || err}`)
    } finally {
      setIsUploading(false)
    }
  }

  const exportCSV = () => {
    if (!deliveries) return
    const rows = [
      ['Aluno', 'Figurinos', 'Status', 'Data Entrega', 'Observacao'],
      ...deliveries.map((d: any) => [
        `"${d.dancers?.name || ''}"`,
        `"${d.costume_name || ''}"`,
        d.delivered ? 'Entregue' : 'Pendente',
        d.delivered && d.delivered_at ? new Date(d.delivered_at).toLocaleDateString('pt-BR') : '',
        `"${d.notes || ''}"`
      ])
    ]
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "entregas_figurinos.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  const filteredCostumes = costumes?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Acervo de Figurinos</h1>
          <p className="text-gray-500">Cadastre e gerencie as roupas e acessórios das coreografias.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-medium"
        >
          <Plus size={20} />
          Novo Figurino
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('catalogo')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'catalogo' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Catálogo de Figurinos
        </button>
        <button
          onClick={() => setActiveTab('entregas')}
          className={`px-6 py-3 font-medium transition-colors ${activeTab === 'entregas' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Controle de Entregas
        </button>
      </div>

      {activeTab === 'catalogo' && (
        <>
          {/* Toolbar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou descrição..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Carregando acervo...</div>
      ) : filteredCostumes?.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
          Nenhum figurino encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCostumes?.map(costume => {
            const count = costume.choreography_costumes?.[0]?.count || 0
            
            return (
              <div key={costume.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden border-b border-gray-100">
                  {costume.image_url ? (
                    <img src={costume.image_url} alt={costume.name} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={48} className="text-gray-300" />
                  )}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEditModal(costume)}
                      className="p-2 bg-white/90 backdrop-blur text-gray-700 hover:text-primary rounded-lg shadow-sm transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(costume.id, costume.name)}
                      className="p-2 bg-white/90 backdrop-blur text-gray-700 hover:text-danger rounded-lg shadow-sm transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-serif font-bold text-lg text-gray-800">{costume.name}</h3>
                    {costume.price && <span className="font-bold text-success text-sm flex-shrink-0">R$ {costume.price}</span>}
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 flex-1 mb-4">{costume.description || 'Sem descrição'}</p>
                  
                  <div className="flex items-center gap-2 text-xs font-medium text-primary bg-primary/5 px-3 py-1.5 rounded-full w-fit">
                    <Music size={14} />
                    {count} {count === 1 ? 'Coreografia' : 'Coreografias'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      </>
      )}

      {activeTab === 'entregas' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-serif text-gray-800">Controle de Entregas</h2>
            <div className="flex gap-3">
              <button onClick={exportCSV} className="text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">Exportar CSV</button>
              <button onClick={handlePrint} className="text-sm font-medium bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg transition-colors">Imprimir Lista</button>
            </div>
          </div>

          {isLoadingDeliveries ? (
            <div className="text-center py-12 text-gray-500">Carregando entregas...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-serif text-gray-700">Aluno</th>
                    <th className="px-6 py-4 font-serif text-gray-700">Figurinos Vinculados</th>
                    <th className="px-6 py-4 font-serif text-gray-700">Observações (Opcional)</th>
                    <th className="px-6 py-4 font-serif text-gray-700 text-center w-48">Status / Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deliveries?.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Nenhum figurino vinculado ainda. Vá em Pagamentos para vincular figurinos.</td>
                    </tr>
                  )}
                  {deliveries?.map((d: any) => (
                    <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{d.dancers?.name || 'Desconhecido'}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]" title={d.costume_name}>{d.costume_name || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setNotesModal({ isOpen: true, id: d.id, notes: d.notes || '' })}
                          className={`flex items-center gap-1 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg border print:hidden ${d.notes ? 'bg-primary/5 text-primary border-primary/20 hover:bg-primary/10' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                        >
                          <span className="text-base">📝</span>
                          {d.notes ? 'Ver Obs' : 'Adicionar'}
                        </button>
                        {d.notes && <span className="hidden print:inline text-sm text-gray-700">{d.notes}</span>}
                      </td>
                      <td className="px-6 py-4">
                        {d.delivered ? (
                          <div className="flex flex-col items-center">
                            <button
                              onClick={() => updateDeliveryMutation.mutate({ id: d.id, delivered: false })}
                              disabled={updateDeliveryMutation.isPending}
                              className="w-full py-1.5 rounded-lg font-bold text-xs transition-colors bg-success/10 text-success border border-success/20 hover:bg-success/20"
                            >
                              Entregue ✅
                            </button>
                            {d.delivered_at && <span className="text-[10px] text-gray-400 mt-1">{new Date(d.delivered_at).toLocaleDateString('pt-BR')}</span>}
                          </div>
                        ) : (
                          <button
                            onClick={() => updateDeliveryMutation.mutate({ id: d.id, delivered: true })}
                            disabled={updateDeliveryMutation.isPending}
                            className="w-full py-1.5 rounded-lg font-bold text-xs transition-colors bg-warning-light text-warning-dark border border-warning-dark/20 hover:bg-warning-light/80"
                          >
                            Marcar como Entregue
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-coxia-dark/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif font-bold text-gray-800">
                {editingId ? 'Editar Figurino' : 'Novo Figurino'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Peça *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Ex: Vestido Vermelho com Lantejoulas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Ex: 150.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto de Referência</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
                {isUploading && (
                  <p className="text-xs text-warning-dark mt-2 font-medium">⏳ Enviando imagem, aguarde...</p>
                )}
                {!isUploading && formData.image_url && (
                  <p className="text-xs text-success mt-2 font-medium">✓ Imagem carregada ({(formData.image_url.substring(0, 30))}...)</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detalhes e Observações</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none h-24"
                  placeholder="Ex: Utilizado também pela turma de jazz..."
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-100 mt-2">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={insertMutation.isPending || updateMutation.isPending || isUploading}
                  className="flex-1 bg-primary text-white px-4 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                >
                  {insertMutation.isPending || updateMutation.isPending ? 'Salvando...' : isUploading ? 'Aguarde o Upload...' : (editingId ? 'Salvar Alterações' : 'Cadastrar Figurino')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Observações */}
      {notesModal.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-serif text-coxia-dark mb-4">Observações de Entrega</h2>
            <textarea 
              value={notesModal.notes}
              onChange={e => setNotesModal({...notesModal, notes: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-none mb-4"
              placeholder="Ex: Faltou a saia, entregar no próximo ensaio..."
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setNotesModal({isOpen: false, id: '', notes: ''})}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  updateDeliveryMutation.mutate({ id: notesModal.id, notes: notesModal.notes })
                  setNotesModal({isOpen: false, id: '', notes: ''})
                }}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 font-medium"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

