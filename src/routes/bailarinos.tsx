import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Plus, Search, MessageCircle, MoreHorizontal, X, Edit2, Trash2, Download } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getFriendlyErrorMessage } from '../lib/errors'
import { phoneMask, getWhatsAppLink } from '../lib/mask'

export const Route = createFileRoute('/bailarinos')({
  component: DancersPage,
})

function DancersPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', contact: '' })
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Fetch dancers with their classes
  const { data: dancers, isLoading, error } = useQuery({
    queryKey: ['dancers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dancers')
        .select(`
          *,
          dancer_classes (
            classes (id, class_code, modality)
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  // Fetch available classes for the form
  const { data: classesList } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('*').order('modality')
      if (error) throw error
      return data
    }
  })

  // Mutation to insert data (Dancer + Classes)
  const insertMutation = useMutation({
    mutationFn: async (newDancer: typeof formData) => {
      // 1. Insert Dancer
      const { data: dancerData, error: dancerError } = await supabase.from('dancers').insert([{
        name: newDancer.name,
        contact: newDancer.contact
      }]).select().single()
      
      if (dancerError) throw dancerError

      // 2. Insert Classes links if any
      if (selectedClasses.length > 0 && dancerData) {
        const links = selectedClasses.map(clsId => ({
          dancer_id: dancerData.id,
          class_id: clsId
        }))
        const { error: linksError } = await supabase.from('dancer_classes').insert(links)
        if (linksError) throw linksError
      }

      return dancerData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dancers'] })
      closeModal()
    }
  })

  // Mutation to update data (Dancer + Classes)
  const updateMutation = useMutation({
    mutationFn: async (updatedDancer: typeof formData) => {
      if (!editingId) return

      // 1. Update Dancer
      const { data: dancerData, error: dancerError } = await supabase.from('dancers').update(updatedDancer).eq('id', editingId).select().single()
      if (dancerError) throw dancerError

      // 2. Delete old links
      const { error: deleteError } = await supabase.from('dancer_classes').delete().eq('dancer_id', editingId)
      if (deleteError) throw deleteError

      // 3. Insert new Classes links
      if (selectedClasses.length > 0) {
        const links = selectedClasses.map(clsId => ({
          dancer_id: editingId,
          class_id: clsId
        }))
        const { error: linksError } = await supabase.from('dancer_classes').insert(links)
        if (linksError) throw linksError
      }

      return dancerData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dancers'] })
      closeModal()
    }
  })

  // Mutation to delete data
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('dancers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dancers'] })
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
    if (window.confirm(`Tem certeza que deseja excluir o bailarino ${name}?`)) {
      deleteMutation.mutate(id)
    }
  }

  const openEditModal = (dancer: any) => {
    setFormData({
      name: dancer.name,
      contact: dancer.contact || ''
    })
    setSelectedClasses(dancer.dancer_classes ? dancer.dancer_classes.map((dc: any) => dc.classes.id) : [])
    setEditingId(dancer.id)
    setIsModalOpen(true)
  }

  const openNewModal = () => {
    setFormData({ name: '', contact: '' })
    setSelectedClasses([])
    setEditingId(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({ name: '', contact: '' })
    setSelectedClasses([])
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!window.confirm('Deseja importar este arquivo CSV? O formato esperado é: Nome;Contato')) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const text = event.target?.result as string
      const lines = text.split(/\r?\n/).filter(l => l.trim() !== '')
      
      if (lines.length <= 1) {
        alert('Arquivo vazio ou contém apenas o cabeçalho.')
        return
      }

      const toInsert = []
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[;,]/)
        const name = cols[0]?.trim()
        if (!name) continue

        toInsert.push({
          name,
          contact: cols[1]?.trim() || ''
        })
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from('dancers').insert(toInsert)
        if (error) {
          alert('Erro na importação: ' + error.message)
        } else {
          alert(`${toInsert.length} bailarinos importados com sucesso!`)
          queryClient.invalidateQueries({ queryKey: ['dancers'] })
        }
      }
    }
    reader.readAsText(file)
  }

  const isPending = insertMutation.isPending || updateMutation.isPending
  const isError = insertMutation.isError || updateMutation.isError
  const activeError = insertMutation.error || updateMutation.error

  const toggleClass = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    )
  }

  const filteredDancers = dancers?.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortOrder === 'asc') return a.name.localeCompare(b.name)
    return b.name.localeCompare(a.name)
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Bailarinos</h1>
          <p className="text-gray-500">Gerencie todos os participantes do festival.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-3">
            <label className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm cursor-pointer" title="O arquivo deve ter colunas na ordem: Nome, Nascimento, Contato">
              <Download size={20} />
              Importar CSV
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>
            <button 
              onClick={openNewModal}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm"
            >
              <Plus size={20} />
              Novo Bailarino
            </button>
          </div>
          <div className="flex gap-4 items-center">
            <p className="text-xs text-gray-500 font-medium">
              Formato CSV/Excel: <span className="text-gray-700 font-bold">Nome; Contato</span>
            </p>
            <button 
              onClick={() => {
                const csv = "Nome;Contato\nJoão da Silva;(11) 99999-9999\nMaria Souza;(11) 88888-8888"
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const link = document.createElement("a")
                link.href = URL.createObjectURL(blob)
                link.download = `Modelo_Importacao_Coxia.csv`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              className="text-xs font-medium text-primary hover:text-primary/80 underline decoration-primary/30 underline-offset-2 transition-colors"
            >
              Baixar Modelo (.csv)
            </button>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar pelo nome..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Carregando bailarinos...</div>
          ) : error ? (
            <div className="p-8 text-center text-danger">Erro ao carregar dados do Supabase.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th 
                    className="px-6 py-4 font-medium cursor-pointer hover:text-primary transition-colors select-none"
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    title="Clique para ordenar por nome"
                  >
                    Nome do Bailarino {sortOrder === 'asc' ? '↑' : '↓'}
                  </th>
                  <th className="px-6 py-4 font-medium">Aulas (Turmas)</th>
                  <th className="px-6 py-4 font-medium text-center">Contato</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDancers?.map(dancer => (
                  <tr key={dancer.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-800">{dancer.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {dancer.dancer_classes && dancer.dancer_classes.length > 0 ? (
                          dancer.dancer_classes.map((dc: any) => (
                            <span key={dc.classes.id} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-xs border border-gray-200" title={dc.classes.modality}>
                              {dc.classes.class_code}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <a 
                        href={getWhatsAppLink(dancer.contact)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-success hover:text-success/80 bg-success/10 hover:bg-success/20 transition-colors px-3 py-1.5 rounded-lg text-sm font-medium"
                        title="Chamar no WhatsApp"
                      >
                        <MessageCircle size={16} />
                        {dancer.contact || 'Sem Contato'}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openEditModal(dancer)}
                          className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                          title="Editar Bailarino"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button 
                          onClick={() => handleDelete(dancer.id, dancer.name)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-danger/70 hover:text-danger transition-colors rounded-lg hover:bg-danger/10 disabled:opacity-50"
                          title="Excluir Bailarino"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {dancers?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">
                      Nenhum bailarino cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal - Cadastrar/Editar Bailarino */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <h2 className="text-xl font-serif text-coxia-dark">
                {editingId ? 'Editar Bailarino' : 'Cadastrar Bailarino'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Ex: Ana Clara Souza"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Turmas Matriculadas</label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
                  {classesList?.map(cls => (
                    <label key={cls.id} className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={selectedClasses.includes(cls.id)}
                        onChange={() => toggleClass(cls.id)}
                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-800">{cls.modality}</span>
                        <span className="text-xs text-gray-500">Cód: {cls.class_code} • {cls.schedule}</span>
                      </div>
                    </label>
                  ))}
                  {classesList?.length === 0 && (
                    <p className="text-xs text-gray-500 italic p-2">Nenhuma turma cadastrada. Acesse o menu "Aulas".</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contato (WhatsApp)</label>
                  <input 
                  type="text" 
                  value={formData.contact}
                  onChange={e => setFormData({...formData, contact: phoneMask(e.target.value)})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              <div className="pt-4 flex gap-3">
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
                  {isPending ? 'Salvando...' : 'Salvar Bailarino'}
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
