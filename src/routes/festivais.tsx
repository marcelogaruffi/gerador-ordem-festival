import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Plus, Calendar as CalendarIcon, MapPin, X, Trash2, Edit2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getFriendlyErrorMessage } from '../lib/errors'

export const Route = createFileRoute('/festivais')({
  component: FestivalsPage,
})

function FestivalsPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    location: '',
    start_date: '',
    end_date: '',
    status: 'Planejamento',
    image_url: '',
    spectacle_fee: 0
  })
  const [noDate, setNoDate] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch data from Supabase
  const { data: festivals, isLoading, error } = useQuery({
    queryKey: ['festivals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('festivals').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  // Mutation to insert data
  const insertMutation = useMutation({
    mutationFn: async (newFestival: typeof formData) => {
      const { data, error } = await supabase.from('festivals').insert([{
        ...newFestival,
        start_date: noDate ? null : newFestival.start_date || null,
        end_date: noDate ? null : newFestival.end_date || null,
        user_id: '00000000-0000-0000-0000-000000000000'
      }])
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivals'] })
      closeModal()
    }
  })

  // Mutation to update data
  const updateMutation = useMutation({
    mutationFn: async (updatedFestival: typeof formData) => {
      if (!editingId) return
      const payload = {
        ...updatedFestival,
        start_date: noDate ? null : updatedFestival.start_date || null,
        end_date: noDate ? null : updatedFestival.end_date || null,
      }
      const { data, error } = await supabase.from('festivals').update(payload).eq('id', editingId)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivals'] })
      closeModal()
    }
  })

  // Mutation to delete data
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('festivals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['festivals'] })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      updateMutation.mutate(formData)
    } else {
      insertMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o festival "${name}"? TODOS OS DADOS DELE SERÃO APAGADOS (Bailarinos, Aulas, Coreografias).`)) {
      deleteMutation.mutate(id)
    }
  }

  const openEditModal = (fest: any) => {
    const hasNoDate = !fest.start_date && !fest.end_date;
    setNoDate(hasNoDate);
    setFormData({
      name: fest.name,
      city: fest.city || '',
      state: fest.state || '',
      location: fest.location || '',
      start_date: fest.start_date || '',
      end_date: fest.end_date || '',
      status: fest.status || 'Planejamento',
      image_url: fest.image_url || '',
      spectacle_fee: fest.spectacle_fee || 0
    })
    setEditingId(fest.id)
    setIsModalOpen(true)
  }

  const openNewModal = () => {
    setNoDate(false)
    setFormData({ name: '', city: '', state: '', location: '', start_date: '', end_date: '', status: 'Planejamento', image_url: '', spectacle_fee: 0 })
    setEditingId(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setNoDate(false)
    setFormData({ name: '', city: '', state: '', location: '', start_date: '', end_date: '', status: 'Planejamento', image_url: '', spectacle_fee: 0 })
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

  const isPending = insertMutation.isPending || updateMutation.isPending
  const isError = insertMutation.isError || updateMutation.isError
  const activeError = insertMutation.error || updateMutation.error

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Festivais</h1>
          <p className="text-gray-500">Gerencie todos os eventos, competições e mostras de dança.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus size={20} />
          Novo Festival
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-2xl">Carregando festivais...</div>
      ) : error ? (
        <div className="p-8 text-center text-danger bg-white rounded-2xl">Erro de comunicação com o servidor. Verifique sua conexão.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {festivals?.map(festival => (
            <div key={festival.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col">
              <div className="h-32 bg-gray-100 relative overflow-hidden">
                <img 
                  src={festival.image_url || `https://source.unsplash.com/random/400x300/?dance,theater&sig=${festival.id}`} 
                  alt={festival.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium border border-white/30">
                    {festival.status}
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-semibold text-gray-800 leading-tight mb-2">{festival.name}</h3>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-primary/70" />
                      {festival.location ? `${festival.location} - ` : ''}{festival.city} {festival.state ? `- ${festival.state}` : ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon size={16} className="text-primary/70" />
                      {(!festival.start_date && !festival.end_date) 
                        ? 'Data a definir' 
                        : `${festival.start_date ? new Date(festival.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'} até ${festival.end_date ? new Date(festival.end_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}`}
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <Link to="/timeline" className="text-primary font-medium text-sm hover:underline">
                    Montar Ordem
                  </Link>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(festival)}
                      className="p-1.5 text-gray-400 hover:text-primary transition-colors rounded-md hover:bg-gray-100"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(festival.id, festival.name)}
                      disabled={deleteMutation.isPending}
                      className="p-1.5 text-danger/70 hover:text-danger transition-colors rounded-md hover:bg-gray-100 disabled:opacity-50"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {festivals?.length === 0 && (
             <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-2xl">
               Nenhum festival cadastrado ainda.
             </div>
          )}
        </div>
      )}

    {/* Modal - Cadastrar/Editar Festival */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-xl font-serif text-coxia-dark">
                {editingId ? 'Editar Festival' : 'Novo Festival'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1">
              <form id="festivalForm" onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Festival *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Ex: Festival de Dança de Inverno"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Local (Teatro / Espaço)</label>
                <input 
                  type="text" 
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Ex: Teatro Municipal Guaíra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Pôster/Arte</label>
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

              <div className="flex gap-4">
                <div className="flex-[2]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input 
                    type="text" 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Ex: Curitiba"
                  />
                </div>
                <div className="flex-[1]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <input 
                    type="text" 
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                    placeholder="Ex: PR"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={noDate}
                    onChange={(e) => setNoDate(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">
                    Ainda sem data (A definir)
                  </span>
                </label>

                <div className={`flex gap-4 transition-opacity duration-300 ${noDate ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                    <input 
                      type="date" 
                      required={!noDate}
                      value={formData.start_date}
                      onChange={e => setFormData({...formData, start_date: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Fim</label>
                    <input 
                      type="date" 
                      required={!noDate}
                      value={formData.end_date}
                      onChange={e => setFormData({...formData, end_date: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="Planejamento">Planejamento</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Espetáculo (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.spectacle_fee}
                  onChange={e => setFormData({...formData, spectacle_fee: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Ex: 150.00"
                />
                <p className="text-xs text-gray-500 mt-1">Valor base cobrado dos bailarinos para este festival.</p>
              </div>

              <div className="pt-4 flex gap-3 sticky bottom-0 bg-white border-t border-gray-100 py-4 mt-4 -mx-6 px-6">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isPending || isUploading}
                  className="flex-1 bg-primary text-white px-4 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                >
                  {isPending ? 'Salvando...' : isUploading ? 'Aguarde o Upload...' : (editingId ? 'Salvar Alterações' : 'Cadastrar Festival')}
                </button>
              </div>
              {isError && (
                <div className="text-danger text-sm font-medium mt-2 bg-danger/10 p-3 rounded-xl border border-danger/20">
                  ⚠️ {getFriendlyErrorMessage(activeError)}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
