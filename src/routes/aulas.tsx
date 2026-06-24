import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Plus, Search, Filter, Clock, Edit2, Trash2, GraduationCap, X } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { getFriendlyErrorMessage } from '../lib/errors'

export const Route = createFileRoute('/aulas')({
  component: AulasPage,
})

function AulasPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    modality: '',
    teacher_id: '',
    class_code: '',
    schedule: '',
    days_of_week: [] as string[]
  })

  const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

  // 1. READ: Buscar aulas
  const { data: classes, isLoading, error } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('*, teachers(id, name)').order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  const { data: teachers } = useQuery({
    queryKey: ['teachers_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('teachers').select('id, name').order('name')
      if (error) throw error
      return data
    }
  })

  // 2. CREATE: Cadastrar nova aula
  const insertMutation = useMutation({
    mutationFn: async (newClass: typeof formData) => {
      const payload = {
        modality: newClass.modality,
        teacher_id: newClass.teacher_id || null,
        class_code: newClass.class_code,
        schedule: newClass.schedule,
        days_of_week: newClass.days_of_week
      }
      const { data, error } = await supabase.from('classes').insert([payload]).select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      closeModal()
    }
  })

  // 3. UPDATE: Editar aula
  const updateMutation = useMutation({
    mutationFn: async (updatedClass: typeof formData) => {
      if (!editingId) return
      const payload = {
        modality: updatedClass.modality,
        teacher_id: updatedClass.teacher_id || null,
        class_code: updatedClass.class_code,
        schedule: updatedClass.schedule,
        days_of_week: updatedClass.days_of_week
      }
      const { data, error } = await supabase.from('classes').update(payload).eq('id', editingId).select()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      closeModal()
    }
  })

  // 4. DELETE: Apagar aula
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('classes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const dataToSubmit = {
      ...formData,
      class_code: formData.class_code.toUpperCase()
    }

    if (editingId) {
      updateMutation.mutate(dataToSubmit)
    } else {
      insertMutation.mutate(dataToSubmit)
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja apagar a turma ${name}?`)) {
      deleteMutation.mutate(id)
    }
  }

  const openEditModal = (cls: any) => {
    setFormData({
      modality: cls.modality || '',
      teacher_id: cls.teacher_id || '',
      class_code: cls.class_code || '',
      schedule: cls.schedule || '',
      days_of_week: cls.days_of_week || []
    })
    setEditingId(cls.id)
    setIsModalOpen(true)
  }

  const openNewModal = () => {
    setFormData({ modality: '', teacher_id: '', class_code: '', schedule: '', days_of_week: [] })
    setEditingId(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
    setFormData({ modality: '', teacher_id: '', class_code: '', schedule: '', days_of_week: [] })
  }

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }))
  }

  const isPending = insertMutation.isPending || updateMutation.isPending
  const isError = insertMutation.isError || updateMutation.isError
  const activeError = insertMutation.error || updateMutation.error

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Aulas</h1>
          <p className="text-gray-500">Gerencie as turmas e modalidades da escola.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm"
        >
          <Plus size={20} />
          Nova Turma
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar turma..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
             <div className="p-8 text-center text-gray-500">Carregando aulas...</div>
          ) : error ? (
             <div className="p-8 text-center text-danger">Erro de comunicação: {(error as any)?.message || 'Tabela não existe'}</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Modalidade / Turma</th>
                  <th className="px-6 py-4 font-medium">Professor</th>
                  <th className="px-6 py-4 font-medium text-center">Código</th>
                  <th className="px-6 py-4 font-medium">Dias & Horário</th>
                  <th className="px-6 py-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classes?.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                          <GraduationCap size={20} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{cls.modality}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {cls.teachers?.name || <span className="text-gray-400 italic">Sem professor vinculado</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-xs font-mono font-medium tracking-wider border border-gray-200">
                        {cls.class_code || '---'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-gray-600">
                        {cls.days_of_week && cls.days_of_week.length > 0 && (
                          <div className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded w-fit">
                            {cls.days_of_week.join(', ')}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-sm">{cls.schedule || '--:--'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => openEditModal(cls)}
                          className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                          title="Editar Turma"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cls.id, cls.modality)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-danger/70 hover:text-danger transition-colors rounded-lg hover:bg-danger/10 disabled:opacity-50"
                          title="Excluir Turma"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {classes?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhuma turma cadastrada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif text-coxia-dark">
                {editingId ? 'Editar Turma' : 'Cadastrar Nova Turma'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade da Turma *</label>
                <input 
                  type="text" 
                  required
                  value={formData.modality}
                  onChange={e => setFormData({...formData, modality: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Ex: Ballet Infantil Avançado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professor(a)</label>
                <select 
                  value={formData.teacher_id}
                  onChange={e => setFormData({...formData, teacher_id: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">Selecione um professor...</option>
                  {teachers?.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                  <input 
                    type="time" 
                    value={formData.schedule}
                    onChange={e => setFormData({...formData, schedule: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código Único *</label>
                  <input 
                    type="text" 
                    required
                    value={formData.class_code}
                    onChange={e => setFormData({...formData, class_code: e.target.value})}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono uppercase"
                    placeholder="Ex: BAL-INF"
                    maxLength={10}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dias da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                        formData.days_of_week.includes(day)
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
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
                  {isPending ? 'Salvando...' : 'Salvar Turma'}
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
