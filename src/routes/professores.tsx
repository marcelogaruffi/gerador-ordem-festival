import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Plus, Search, MoreHorizontal, X, Trash2, Edit2, UserCheck, Users as UsersIcon } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getFriendlyErrorMessage } from '../lib/errors'
import { phoneMask, getWhatsAppLink } from '../lib/mask'

export const Route = createFileRoute('/professores')({
  component: TeachersPage,
})

function TeachersPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', contact: '' })

  const [studentsModalOpen, setStudentsModalOpen] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null)

  // Fetch teachers with their classes and dancers
  const { data: teachers, isLoading, error } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          classes (
            id,
            modality,
            dancer_classes (
              dancers (
                id,
                name,
                contact
              )
            )
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  // Insert mutation
  const insertMutation = useMutation({
    mutationFn: async (newTeacher: typeof formData) => {
      const { data, error } = await supabase.from('teachers').insert([newTeacher]).select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      closeModal()
    }
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedTeacher: typeof formData) => {
      if (!editingId) return
      const { data, error } = await supabase.from('teachers').update(updatedTeacher).eq('id', editingId)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      closeModal()
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teachers').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
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
    if (window.confirm(`Tem certeza que deseja excluir o professor(a) ${name}?`)) {
      deleteMutation.mutate(id)
    }
  }

  const openEditModal = (teacher: any) => {
    setFormData({
      name: teacher.name,
      contact: teacher.contact || ''
    })
    setEditingId(teacher.id)
    setIsModalOpen(true)
  }

  const openNewModal = () => {
    setFormData({ name: '', contact: '' })
    setEditingId(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({ name: '', contact: '' })
  }

  const openStudentsModal = (teacher: any) => {
    setSelectedTeacher(teacher)
    setStudentsModalOpen(true)
  }

  const isPending = insertMutation.isPending || updateMutation.isPending
  const isError = insertMutation.isError || updateMutation.isError
  const activeError = insertMutation.error || updateMutation.error

  // Extrair alunos únicos de um professor
  const getUniqueStudents = (teacher: any) => {
    if (!teacher || !teacher.classes) return []
    const studentsMap = new Map()
    teacher.classes.forEach((cls: any) => {
      if (cls.dancer_classes) {
        cls.dancer_classes.forEach((dc: any) => {
          if (dc.dancers && !studentsMap.has(dc.dancers.id)) {
            studentsMap.set(dc.dancers.id, {
              ...dc.dancers,
              classesNames: [cls.modality]
            })
          } else if (dc.dancers) {
            const existing = studentsMap.get(dc.dancers.id)
            existing.classesNames.push(cls.modality)
          }
        })
      }
    })
    return Array.from(studentsMap.values())
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Professores</h1>
          <p className="text-gray-500">Cadastre a equipe e acompanhe as turmas e alunos.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus size={20} />
          Novo Professor
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar professor..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Carregando professores...</div>
          ) : error ? (
            <div className="p-8 text-center text-danger">Erro de comunicação: {(error as any)?.message || 'Erro desconhecido'}</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Nome</th>
                  <th className="px-6 py-4 font-medium text-center">Turmas</th>
                  <th className="px-6 py-4 font-medium text-center">Alunos</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {teachers?.map(teacher => {
                  const uniqueStudents = getUniqueStudents(teacher)
                  const classesCount = teacher.classes ? teacher.classes.length : 0

                  return (
                    <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <UserCheck size={18} />
                          </div>
                          <span className="font-semibold text-gray-800">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                          {classesCount} {classesCount === 1 ? 'turma' : 'turmas'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => openStudentsModal(teacher)}
                          className="flex items-center gap-2 mx-auto px-3 py-1 bg-primary/5 text-primary hover:bg-primary/10 rounded-full text-sm font-medium transition-colors"
                        >
                          <UsersIcon size={14} />
                          {uniqueStudents.length} alunos
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => openEditModal(teacher)}
                            className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                            title="Editar"
                          >
                            <Edit2 size={20} />
                          </button>
                          <button 
                            onClick={() => handleDelete(teacher.id, teacher.name)}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-danger/70 hover:text-danger transition-colors rounded-lg hover:bg-danger/10 disabled:opacity-50"
                            title="Excluir"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {teachers?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhum professor cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal - Cadastrar/Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif text-coxia-dark">
                {editingId ? 'Editar Professor' : 'Novo Professor'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Ex: Maria Clara"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-100 mt-2">
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
                  {isPending ? 'Salvando...' : 'Salvar'}
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

      {/* Modal - Lista de Alunos do Professor */}
      {studentsModalOpen && selectedTeacher && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-xl font-serif text-coxia-dark">
                  Alunos de {selectedTeacher.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Lista unificada de todos os bailarinos matriculados em suas turmas.</p>
              </div>
              <button onClick={() => setStudentsModalOpen(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {getUniqueStudents(selectedTeacher).length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  Nenhum aluno matriculado nas turmas deste professor ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {getUniqueStudents(selectedTeacher).map((student: any) => (
                    <div key={student.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-800">{student.name}</div>
                        <div className="text-sm text-gray-500 mt-1 flex gap-2">
                          {student.classesNames.map((cName: string, idx: number) => (
                            <span key={idx} className="bg-white px-2 py-0.5 rounded border border-gray-200 text-xs">
                              {cName}
                            </span>
                          ))}
                        </div>
                      </div>
                      {student.contact && (
                        <a 
                          href={getWhatsAppLink(student.contact)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-sm text-success bg-success/10 hover:bg-success/20 px-3 py-1.5 rounded-lg border border-success/20 transition-colors font-medium"
                          title="Chamar aluno no WhatsApp"
                        >
                          <UsersIcon size={14} className="hidden" /> {/* just filler for icon matching if needed */}
                          WhatsApp
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
