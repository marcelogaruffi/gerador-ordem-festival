import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Plus, Search, Clock, X, Trash2, Edit2, Music, GraduationCap, Users } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getFriendlyErrorMessage } from '../lib/errors'
import { timeMask } from '../lib/mask'

export const Route = createFileRoute('/coreografias')({
  component: CoreografiasPage,
})

function CoreografiasPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Elenco Modal State
  const [castModalData, setCastModalData] = useState<{id: string, name: string} | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    style: '',
    duration: ''
  })
  
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])

  // 1. Fetch choreographies
  const { data: choreographies, isLoading, error } = useQuery({
    queryKey: ['choreographies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('choreographies')
        .select(`
          *,
          choreography_classes (
            classes (
              id,
              modality,
              class_code
            )
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  // 2. Fetch available classes
  const { data: classesList } = useQuery({
    queryKey: ['classes_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('id, modality, class_code').order('modality')
      if (error) throw error
      return data
    }
  })

  // Mutations
  const insertMutation = useMutation({
    mutationFn: async (newChoreo: typeof formData) => {
      const { data: choreoData, error: choreoError } = await supabase.from('choreographies').insert([newChoreo]).select().single()
      if (choreoError) throw choreoError

      if (selectedClasses.length > 0 && choreoData) {
        const links = selectedClasses.map(clsId => ({
          choreography_id: choreoData.id,
          class_id: clsId
        }))
        const { error: linkError } = await supabase.from('choreography_classes').insert(links)
        if (linkError) throw linkError
      }
      return choreoData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choreographies'] })
      closeModal()
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (updatedChoreo: typeof formData) => {
      if (!editingId) return
      
      const { error: choreoError } = await supabase.from('choreographies').update(updatedChoreo).eq('id', editingId)
      if (choreoError) throw choreoError

      const { error: delError } = await supabase.from('choreography_classes').delete().eq('choreography_id', editingId)
      if (delError) throw delError

      if (selectedClasses.length > 0) {
        const links = selectedClasses.map(clsId => ({
          choreography_id: editingId,
          class_id: clsId
        }))
        const { error: linkError } = await supabase.from('choreography_classes').insert(links)
        if (linkError) throw linkError
      }
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choreographies'] })
      closeModal()
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('choreographies').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choreographies'] })
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
    if (window.confirm(`Tem certeza que deseja apagar a coreografia ${name}?`)) {
      deleteMutation.mutate(id)
    }
  }

  const openEditModal = (choreo: any) => {
    setFormData({
      name: choreo.name || '',
      style: choreo.style || '',
      duration: choreo.duration || ''
    })
    const linkedClasses = choreo.choreography_classes 
      ? choreo.choreography_classes.map((link: any) => link.classes?.id).filter(Boolean)
      : []
    setSelectedClasses(linkedClasses)
    setEditingId(choreo.id)
    setIsModalOpen(true)
  }

  const openNewModal = () => {
    setFormData({ name: '', style: '', duration: '' })
    setSelectedClasses([])
    setEditingId(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({ name: '', style: '', duration: '' })
    setSelectedClasses([])
  }

  const toggleClass = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  // Soma de Tempos
  const totalSeconds = choreographies?.reduce((acc, choreo) => {
    if (!choreo.duration) return acc
    const parts = choreo.duration.split(':')
    if (parts.length === 2) {
      const mins = parseInt(parts[0]) || 0
      const secs = parseInt(parts[1]) || 0
      return acc + (mins * 60) + secs
    }
    return acc
  }, 0) || 0

  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMins = Math.floor((totalSeconds % 3600) / 60)
  const totalSecs = totalSeconds % 60
  const formattedTotal = totalHours > 0 
    ? `${totalHours.toString().padStart(2, '0')}:${totalMins.toString().padStart(2, '0')}:${totalSecs.toString().padStart(2, '0')}`
    : `${totalMins.toString().padStart(2, '0')}:${totalSecs.toString().padStart(2, '0')}`

  const isPending = insertMutation.isPending || updateMutation.isPending
  const isError = insertMutation.isError || updateMutation.isError
  const activeError = insertMutation.error || updateMutation.error

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Coreografias</h1>
          <p className="text-gray-500">Gerencie as coreografias e seus elencos.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus size={20} />
          Nova Coreografia
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar coreografia..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Carregando coreografias...</div>
          ) : error ? (
            <div className="p-8 text-center text-danger">Erro de comunicação: {(error as any)?.message || 'Tabela não existe'}</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Nome da Coreografia</th>
                  <th className="px-6 py-4 font-medium">Turmas Vinculadas</th>
                  <th className="px-6 py-4 font-medium text-center">Duração</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {choreographies?.map((choreo) => {
                  const linkedClasses = choreo.choreography_classes 
                    ? choreo.choreography_classes.map((c: any) => c.classes).filter(Boolean) 
                    : []

                  return (
                    <tr key={choreo.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                            <Music size={20} />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{choreo.name}</div>
                            {choreo.style && <div className="text-xs text-gray-500 mt-0.5">{choreo.style}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {linkedClasses.length > 0 ? (
                            linkedClasses.map((cls: any, i: number) => (
                              <div key={i} className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-lg border border-gray-200">
                                <GraduationCap size={14} className="text-primary/60" />
                                <span className="text-xs text-gray-700 font-medium">
                                  {cls.modality}
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 italic text-sm">Nenhuma turma vinculada</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2 text-gray-600">
                          <Clock size={16} className="text-gray-400" />
                          <span className="font-medium text-gray-700">{choreo.duration || '--:--'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => setCastModalData({ id: choreo.id, name: choreo.name })}
                            className="p-2 text-gray-400 hover:text-secondary transition-colors rounded-lg hover:bg-secondary/10"
                            title="Gerenciar Elenco (Alunos)"
                          >
                            <Users size={20} />
                          </button>
                          <div className="w-px h-4 bg-gray-200 mx-1"></div>
                          <button 
                            onClick={() => openEditModal(choreo)}
                            className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                            title="Editar Dados Básicos"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button 
                            onClick={() => handleDelete(choreo.id, choreo.name)}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-danger/70 hover:text-danger transition-colors rounded-lg hover:bg-danger/10 disabled:opacity-50"
                            title="Excluir Coreografia"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {choreographies?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Nenhuma coreografia cadastrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-primary/5 border-t-2 border-primary/20">
                <tr>
                  <td colSpan={2} className="px-6 py-4 font-semibold text-primary text-right">
                    Tempo Total do Espetáculo:
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-primary font-bold">
                      <Clock size={18} />
                      {formattedTotal}
                    </div>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Modal - Cadastrar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-serif text-coxia-dark">
                {editingId ? 'Editar Coreografia' : 'Nova Coreografia'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Coreografia *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Ex: Dança dos Cisnes"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-[2]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estilo / Modalidade</label>
                    <input 
                      type="text" 
                      value={formData.style}
                      onChange={e => setFormData({...formData, style: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Ex: Ballet Clássico"
                    />
                  </div>
                  <div className="flex-[1]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duração *</label>
                    <input 
                      type="text" 
                      required
                      value={formData.duration}
                      onChange={e => setFormData({...formData, duration: timeMask(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                      placeholder="03:30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Turmas (Aulas) Vinculadas</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto">
                    <div className="flex flex-col gap-2">
                      {classesList?.length === 0 && (
                        <div className="text-sm text-gray-500 italic p-2 text-center">
                          Nenhuma turma cadastrada no sistema.
                        </div>
                      )}
                      {classesList?.map(cls => (
                        <label 
                          key={cls.id} 
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            selectedClasses.includes(cls.id) ? 'bg-primary/5 border border-primary/20' : 'hover:bg-gray-100 border border-transparent'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedClasses.includes(cls.id)}
                            onChange={() => toggleClass(cls.id)}
                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">{cls.modality}</span>
                            {cls.class_code && <span className="text-xs text-gray-500 font-mono">Cód: {cls.class_code}</span>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3 border-t border-gray-100 mt-6">
                  <button 
                    type="button" 
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="flex-1 bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
                  >
                    {isPending ? 'Salvando...' : 'Salvar Coreografia'}
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
        </div>
      )}

      {/* Modal de Elenco */}
      {castModalData && (
        <CastManagerModal 
          choreoId={castModalData.id} 
          choreoName={castModalData.name} 
          onClose={() => setCastModalData(null)} 
        />
      )}

    </div>
  )
}

// -----------------------------------------
// Componente Modal Exclusivo para Elenco
// -----------------------------------------
function CastManagerModal({ choreoId, choreoName, onClose }: { choreoId: string, choreoName: string, onClose: () => void }) {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')

  // 1. Fetch todos os bailarinos da escola
  const { data: allDancers } = useQuery({
    queryKey: ['dancers_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('dancers').select('id, name').order('name')
      if (error) throw error
      return data
    }
  })

  // Fetch todas as turmas para o dropdown
  const { data: classesList } = useQuery({
    queryKey: ['classes_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('id, modality, class_code').order('modality')
      if (error) throw error
      return data
    }
  })

  // 2. Fetch elenco atual e as turmas dessa coreografia
  const { data: castInfo, isLoading: isCastLoading } = useQuery({
    queryKey: ['choreo_cast', choreoId],
    queryFn: async () => {
      // Buscar elenco
      const { data: castData, error: castError } = await supabase
        .from('choreography_dancers')
        .select('dancers(id, name)')
        .eq('choreography_id', choreoId)
      if (castError) throw castError

      // Buscar turmas vinculadas para a função "Puxar Turma"
      const { data: classesData, error: classesError } = await supabase
        .from('choreography_classes')
        .select('class_id')
        .eq('choreography_id', choreoId)
      if (classesError) throw classesError

      const castIds = castData.map(c => c.dancers?.id).filter(Boolean)
      const classIds = classesData.map(c => c.class_id)
      
      return { castIds, classIds }
    }
  })

  const [localCast, setLocalCast] = useState<string[]>([])
  
  // Sincroniza estado local quando o fetch termina
  React.useEffect(() => {
    if (castInfo) {
      setLocalCast(castInfo.castIds as string[])
    }
  }, [castInfo])

  // Puxar todos alunos de uma turma ESPECÍFICA
  const pullSpecificClassMutation = useMutation({
    mutationFn: async (classId: string) => {
      const { data, error } = await supabase
        .from('dancer_classes')
        .select('dancer_id')
        .eq('class_id', classId)
      
      if (error) throw error
      
      const studentsFromClass = data.map(d => d.dancer_id)
      
      // Mesclar sem duplicatas
      setLocalCast(prev => Array.from(new Set([...prev, ...studentsFromClass])))
    }
  })

  // Salvar elenco
  const saveCastMutation = useMutation({
    mutationFn: async () => {
      // Deleta atual
      const { error: delError } = await supabase.from('choreography_dancers').delete().eq('choreography_id', choreoId)
      if (delError) throw delError

      // Insere novos
      if (localCast.length > 0) {
        const links = localCast.map(dId => ({
          choreography_id: choreoId,
          dancer_id: dId
        }))
        const { error: insError } = await supabase.from('choreography_dancers').insert(links)
        if (insError) throw insError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['choreo_cast', choreoId] })
      onClose()
    }
  })

  const toggleDancer = (id: string) => {
    setLocalCast(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const removeDancer = (id: string) => {
    setLocalCast(prev => prev.filter(x => x !== id))
  }

  // Listas filtradas
  const searchLower = searchTerm.toLowerCase()
  const availableDancers = allDancers?.filter(d => !localCast.includes(d.id) && d.name.toLowerCase().includes(searchLower)) || []
  const castDancers = allDancers?.filter(d => localCast.includes(d.id)) || []

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-serif text-coxia-dark flex items-center gap-2">
              <Users className="text-secondary" />
              Elenco da Coreografia
            </h2>
            <p className="text-gray-500 font-medium">{choreoName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 rounded-lg transition-colors">
            <X size={24} />
          </button>
        </div>

        {isCastLoading ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Carregando elenco...
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            
            {/* Coluna Esquerda: Buscar e Adicionar */}
            <div className="w-1/2 border-r border-gray-100 flex flex-col bg-gray-50/30">
              <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
                <select 
                  onChange={(e) => {
                    if (e.target.value) {
                      pullSpecificClassMutation.mutate(e.target.value)
                      e.target.value = '' // reset immediately
                    }
                  }}
                  className="w-full px-4 py-3 bg-white border-2 border-primary/20 text-gray-800 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-primary/30 shadow-sm cursor-pointer hover:border-primary/40 transition-all"
                >
                  <option value="" className="text-gray-500 font-normal">🎓 Clique para selecionar e puxar uma Turma...</option>
                  {classesList?.map(cls => (
                    <option key={cls.id} value={cls.id} className="text-gray-800 font-medium py-1">
                      {cls.modality} {cls.class_code ? `(${cls.class_code})` : ''}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar aluno na escola inteira..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Alunos Disponíveis ({availableDancers.length})
                </div>
                <div className="flex flex-col gap-2">
                  {availableDancers.slice(0, 50).map(dancer => (
                    <div key={dancer.id} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-xl shadow-sm hover:border-gray-200 transition-colors">
                      <span className="font-medium text-gray-700">{dancer.name}</span>
                      <button 
                        onClick={() => toggleDancer(dancer.id)}
                        className="bg-primary/5 hover:bg-primary/10 text-primary p-1.5 rounded-lg transition-colors"
                        title="Adicionar ao Elenco"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  ))}
                  {availableDancers.length > 50 && (
                    <div className="text-center text-sm text-gray-400 py-2">
                      Use a busca para encontrar mais alunos.
                    </div>
                  )}
                  {availableDancers.length === 0 && (
                    <div className="text-center text-sm text-gray-400 py-4 italic">
                      Nenhum aluno encontrado ou todos já estão no elenco.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Coluna Direita: Elenco Montado */}
            <div className="w-1/2 flex flex-col bg-white">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-primary/5">
                <div className="font-semibold text-primary flex items-center gap-2">
                  Elenco Escalonado 
                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">
                    {castDancers.length}
                  </span>
                </div>
                {localCast.length > 0 && (
                  <button onClick={() => setLocalCast([])} className="text-xs text-danger hover:underline">
                    Limpar Todos
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col gap-2">
                  {castDancers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                      <Users size={32} className="opacity-20" />
                      <p className="text-sm">O elenco está vazio.</p>
                      <p className="text-xs">Use o botão "Puxar Elenco" ou busque alunos ao lado.</p>
                    </div>
                  ) : (
                    castDancers.map((dancer, i) => (
                      <div key={dancer.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-xl group hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-gray-400 w-5">{i + 1}.</span>
                          <span className="font-medium text-gray-800">{dancer.name}</span>
                        </div>
                        <button 
                          onClick={() => removeDancer(dancer.id)}
                          className="text-gray-300 hover:text-danger hover:bg-danger/10 p-1.5 rounded-lg transition-colors"
                          title="Remover do Elenco"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Salvar Elenco Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 mt-auto">
                <button 
                  onClick={() => saveCastMutation.mutate()}
                  disabled={saveCastMutation.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-medium shadow-sm disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {saveCastMutation.isPending ? 'Salvando Elenco...' : 'Confirmar e Salvar Elenco'}
                </button>
                {saveCastMutation.isError && (
                  <div className="text-danger text-sm mt-2 text-center">
                    {getFriendlyErrorMessage(saveCastMutation.error)}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
