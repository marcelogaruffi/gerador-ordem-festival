import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useMemo } from 'react'
import { Calendar, Plus, GripVertical, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Trash2, Clock, ListOrdered, Printer } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/timeline')({
  component: TimelinePage,
})

function TimelinePage() {
  const queryClient = useQueryClient()
  const [selectedFestival, setSelectedFestival] = useState<string>('')
  const [selectedChoreoToAdd, setSelectedChoreoToAdd] = useState<string>('')

  // 1. Fetch Festivals
  const { data: festivals } = useQuery({
    queryKey: ['festivals_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('festivals').select('id, name').order('created_at')
      if (error) throw error
      return data
    }
  })

  // Set default festival
  React.useEffect(() => {
    if (festivals && festivals.length > 0 && !selectedFestival) {
      setSelectedFestival(festivals[0].id)
    }
  }, [festivals, selectedFestival])

  // 2. Fetch Timeline Data (Ordered Choreographies for the festival)
  const { data: timelineItems, isLoading: isTimelineLoading, error: timelineError } = useQuery({
    queryKey: ['timeline', selectedFestival],
    queryFn: async () => {
      if (!selectedFestival) return []
      
      const { data, error } = await supabase
        .from('festival_choreographies')
        .select(`
          id,
          order_index,
          choreography_id,
          choreographies (
            id,
            name,
            duration,
            choreography_dancers (
              dancers (
                id,
                name
              )
            )
          )
        `)
        .eq('festival_id', selectedFestival)
        .order('order_index', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: !!selectedFestival
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('tolerance').eq('id', 1).single()
      return data || { tolerance: 1 }
    }
  })

  // 3. Fetch All Choreographies (to add to timeline)
  const { data: allChoreographies } = useQuery({
    queryKey: ['all_choreos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('choreographies').select('id, name').order('name')
      if (error) throw error
      return data
    }
  })

  // Choreos not in the current timeline
  const availableChoreos = useMemo(() => {
    if (!allChoreographies || !timelineItems) return []
    const timelineChoreoIds = timelineItems.map(t => t.choreography_id)
    return allChoreographies.filter(c => !timelineChoreoIds.includes(c.id))
  }, [allChoreographies, timelineItems])

  // --- Mutations ---

  const addMutation = useMutation({
    mutationFn: async (choreoId: string) => {
      if (!selectedFestival) return
      const nextIndex = timelineItems ? timelineItems.length : 0
      const { error } = await supabase.from('festival_choreographies').insert([{
        festival_id: selectedFestival,
        choreography_id: choreoId,
        order_index: nextIndex
      }])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', selectedFestival] })
      setSelectedChoreoToAdd('')
    },
    onError: (error: any) => {
      alert(`Erro ao adicionar: ${error.message || error}`)
    }
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('festival_choreographies').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', selectedFestival] })
    }
  })

  const reorderMutation = useMutation({
    mutationFn: async ({ id1, index1, id2, index2 }: { id1: string, index1: number, id2: string, index2: number }) => {
      // Swap order_index
      const { error: e1 } = await supabase.from('festival_choreographies').update({ order_index: index2 }).eq('id', id1)
      if (e1) throw e1
      const { error: e2 } = await supabase.from('festival_choreographies').update({ order_index: index1 }).eq('id', id2)
      if (e2) throw e2
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline', selectedFestival] })
    }
  })

  const moveUp = (currentIndex: number) => {
    if (currentIndex === 0 || !timelineItems) return
    const current = timelineItems[currentIndex]
    const prev = timelineItems[currentIndex - 1]
    reorderMutation.mutate({
      id1: current.id, index1: current.order_index,
      id2: prev.id, index2: prev.order_index
    })
  }

  const moveDown = (currentIndex: number) => {
    if (!timelineItems || currentIndex === timelineItems.length - 1) return
    const current = timelineItems[currentIndex]
    const next = timelineItems[currentIndex + 1]
    reorderMutation.mutate({
      id1: current.id, index1: current.order_index,
      id2: next.id, index2: next.order_index
    })
  }

  // --- Conflict Calculation Algorithm ---
  const getConflicts = (currentIndex: number) => {
    if (!timelineItems || currentIndex === 0) return { status: 'green', messages: [] }
    
    const currentItem = timelineItems[currentIndex]
    const currentDancers = currentItem.choreographies?.choreography_dancers?.map((c: any) => c.dancers?.name).filter(Boolean) || []
    
    const prevItem1 = timelineItems[currentIndex - 1] // 0 interval (back to back)
    const prev1Dancers = prevItem1?.choreographies?.choreography_dancers?.map((c: any) => c.dancers?.name).filter(Boolean) || []
    
    const intersection1 = currentDancers.filter((d: string) => prev1Dancers.includes(d))
    
    if (intersection1.length > 0) {
      return {
        status: 'red',
        messages: [`Sem Intervalo (Troca Urgente): ${intersection1.join(', ')}`]
      }
    }

    const tolerance = settings?.tolerance ?? 1
    const yellowMessages: string[] = []

    for (let t = 2; t <= tolerance + 1; t++) {
      if (currentIndex >= t) {
        const prevT = timelineItems[currentIndex - t]
        const prevTDancers = prevT?.choreographies?.choreography_dancers?.map((c: any) => c.dancers?.name).filter(Boolean) || []
        const intersectionT = currentDancers.filter((d: string) => prevTDancers.includes(d))
        
        if (intersectionT.length > 0) {
           yellowMessages.push(`${t - 1} Intervalo(s) (Troca Corrida): ${intersectionT.join(', ')}`)
        }
      }
    }

    if (yellowMessages.length > 0) {
      return { status: 'yellow', messages: yellowMessages }
    }

    return { status: 'green', messages: [] }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Timeline & Conflitos</h1>
          <p className="text-gray-500">Organize a ordem do espetáculo e detecte conflitos de elenco.</p>
        </div>
        <div className="flex gap-3 print-hidden">
          <button 
            onClick={() => window.print()}
            disabled={!timelineItems || timelineItems.length === 0}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            <Printer size={20} />
            Imprimir (PDF)
          </button>
          <button 
            onClick={() => {
              if (!timelineItems || timelineItems.length === 0) return
              let csv = "Ordem;Coreografia;Estilo;Duracao\n"
              timelineItems.forEach((item, index) => {
                if (index === 0) return
                const name = item.choreographies?.name || ''
                const style = item.choreographies?.style || ''
                const duration = item.choreographies?.duration || ''
                csv += `${index};"${name}";"${style}";"${duration}"\n`
              })
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
              const link = document.createElement("a")
              link.href = URL.createObjectURL(blob)
              link.download = `Ordem_Festival.csv`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
            disabled={!timelineItems || timelineItems.length === 0}
            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50"
          >
            Baixar Ordem (CSV)
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between print-hidden">
        <div className="flex items-center gap-3 flex-1">
          <Calendar className="text-primary" />
          <select 
            value={selectedFestival}
            onChange={(e) => setSelectedFestival(e.target.value)}
            className="flex-1 max-w-sm px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-medium text-gray-800"
          >
            {festivals?.length === 0 && <option value="">Nenhum festival cadastrado</option>}
            {festivals?.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        {selectedFestival && (
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <select
              value={selectedChoreoToAdd}
              onChange={(e) => setSelectedChoreoToAdd(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            >
              <option value="">+ Selecionar Coreografia para a Timeline...</option>
              {availableChoreos.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button 
              onClick={() => {
                if (selectedChoreoToAdd) addMutation.mutate(selectedChoreoToAdd)
              }}
              disabled={!selectedChoreoToAdd || addMutation.isPending}
              className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              Adicionar
            </button>
          </div>
        )}
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        {timelineError && (
          <div className="p-4 mb-4 bg-danger/10 text-danger rounded-xl">
            Erro ao carregar timeline: {(timelineError as Error).message}
          </div>
        )}
        {!selectedFestival ? (
          <div className="text-center py-12 text-gray-500">
            Selecione ou crie um Festival primeiro para montar a Timeline.
          </div>
        ) : isTimelineLoading ? (
          <div className="text-center py-12 text-gray-500">Carregando timeline...</div>
        ) : timelineItems?.length === 0 ? (
          <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-3">
            <ListOrdered size={40} className="text-gray-300" />
            <p>Nenhuma coreografia na ordem do show ainda.</p>
            <p className="text-sm">Use o campo acima para adicionar as coreografias que farão parte deste festival.</p>
          </div>
        ) : (
          <div className="space-y-3 relative">
            {/* Timeline Line visual */}
            <div className="absolute left-6 top-4 bottom-4 w-px bg-gray-200 z-0"></div>

            {timelineItems?.map((item, index) => {
              const conflicts = getConflicts(index)
              
              let statusClasses = "border-gray-200 bg-white"
              let icon = <CheckCircle className="text-success" size={20} />
              
              if (conflicts.status === 'red') {
                statusClasses = "border-danger bg-danger/5"
                icon = <AlertTriangle className="text-danger" size={20} />
              } else if (conflicts.status === 'yellow') {
                statusClasses = "border-warning bg-warning/5"
                icon = <AlertTriangle className="text-warning" size={20} />
              }

              return (
                <div key={item.id} className={`relative z-10 flex items-center gap-4 p-4 rounded-xl border ${statusClasses} transition-all`}>
                  
                  {/* Order Number */}
                  <div className="w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center font-bold text-gray-700 shrink-0 shadow-sm">
                    {index + 1}
                  </div>

                  {/* Move Buttons */}
                  <div className="flex flex-col gap-1 shrink-0 print-hidden">
                    <button 
                      onClick={() => moveUp(index)}
                      disabled={index === 0 || reorderMutation.isPending}
                      className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded disabled:opacity-30 transition-colors"
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button 
                      onClick={() => moveDown(index)}
                      disabled={index === timelineItems.length - 1 || reorderMutation.isPending}
                      className="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded disabled:opacity-30 transition-colors"
                    >
                      <ArrowDown size={18} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-gray-800 truncate">
                        {item.choreographies?.name}
                      </h3>
                      {item.choreographies?.duration && (
                        <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          <Clock size={12} /> {item.choreographies.duration}
                        </span>
                      )}
                    </div>
                    
                    {/* Conflict Messages */}
                    {conflicts.status !== 'green' && (
                      <div className={`mt-2 text-sm font-medium flex flex-col gap-1 ${conflicts.status === 'red' ? 'text-danger' : 'text-yellow-600'}`}>
                        {conflicts.messages.map((msg, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            <span>{msg}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {conflicts.status === 'green' && index > 0 && (
                      <div className="mt-1 text-xs text-success flex items-center gap-1 font-medium">
                        <CheckCircle size={12} /> Troca de elenco tranquila.
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100">
                      {icon}
                    </div>
                  <div className="shrink-0 print-hidden">
                    <button 
                      onClick={() => {
                        if (window.confirm('Remover da timeline?')) {
                          removeMutation.mutate(item.id)
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
