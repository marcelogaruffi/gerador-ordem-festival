import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle, Clock, GripVertical, Settings2, Download } from 'lucide-react'

export const Route = createFileRoute('/ordem')({
  component: OrdemPage,
})

// MOCK DATA for algorithm testing
const initialChoreos = [
  { id: 'c1', name: 'Abertura Mágica', duration: 4, dancers: ['Ana', 'Bia'], isOpening: true },
  { id: 'c2', name: 'Jazz Contemporâneo', duration: 3, dancers: ['Carlos', 'João'], isOpening: false },
  { id: 'c3', name: 'Ballet Infantil - Fadas', duration: 3, dancers: ['Sofia', 'Clara'], isOpening: false },
  { id: 'c4', name: 'Danças Urbanas X', duration: 4, dancers: ['Ana', 'Carlos'], isOpening: false },
  { id: 'c5', name: 'Solo Clássico', duration: 2, dancers: ['Bia'], isOpening: false },
]

function SortableItem({ id, choreo, index, conflict }: { id: string, choreo: any, index: number, conflict: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 bg-white p-4 rounded-xl border ${isDragging ? 'border-primary shadow-xl scale-[1.02]' : 'border-gray-100 shadow-sm'} hover:shadow-md transition-all mb-3`}
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:text-primary text-gray-400 p-2">
        <GripVertical size={20} />
      </div>
      
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm">
        {index + 1}
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{choreo.name}</h3>
        <p className="text-sm text-gray-500">
          Duração: {choreo.duration} min • Bailarinos: {choreo.dancers.join(', ')}
        </p>
      </div>

      {conflict && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
          ${conflict.level === 'grave' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
          <AlertTriangle size={16} />
          {conflict.message}
        </div>
      )}
    </div>
  )
}

function OrdemPage() {
  const [choreos, setChoreos] = useState(initialChoreos)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setChoreos((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  function calculateConflicts(items: typeof initialChoreos) {
    // Basic Algorithm: checks if the same dancer dances with less than 2 choreos apart.
    const conflicts = new Map()
    
    for (let i = 0; i < items.length; i++) {
      for (const dancer of items[i].dancers) {
        // Look back up to 2 choreographies
        for (let j = 1; j <= 2; j++) {
          if (i - j >= 0 && items[i - j].dancers.includes(dancer)) {
            // Found a conflict!
            const level = j === 1 ? 'grave' : 'atencao'
            const msg = `Troca de roupa para ${dancer} (${j} coreo. de intervalo)`
            conflicts.set(items[i].id, { level, message: msg })
          }
        }
      }
    }
    return conflicts
  }

  const currentConflicts = calculateConflicts(choreos)
  const totalTime = choreos.reduce((acc, c) => acc + c.duration, 0)

  const handleExportPDF = () => {
    import('jspdf').then(module => {
      const jsPDF = module.default
      import('jspdf-autotable').then(autoTableModule => {
        const autoTable = autoTableModule.default
        const doc = new jsPDF()
        
        doc.setFontSize(20)
        doc.text('Ordem de Apresentação - COXIA', 14, 22)
        
        const tableData = choreos.map((c, i) => [
          (i + 1).toString(),
          c.name,
          `${c.duration} min`,
          c.dancers.join(', '),
          currentConflicts.has(c.id) ? 'ATENÇÃO' : 'OK'
        ])
        
        autoTable(doc, {
          startY: 30,
          head: [['Ordem', 'Coreografia', 'Duração', 'Bailarinos', 'Status']],
          body: tableData,
        })
        
        doc.save('coxia-ordem-apresentacao.pdf')
      })
    })
  }

  const handleExportExcel = () => {
    import('xlsx').then(XLSX => {
      const data = choreos.map((c, i) => ({
        Ordem: i + 1,
        Coreografia: c.name,
        Duracao_Min: c.duration,
        Bailarinos: c.dancers.join(', '),
        Conflitos: currentConflicts.has(c.id) ? 'Sim' : 'Não'
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Ordem")
      XLSX.writeFile(wb, "coxia-ordem.xlsx")
    })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Timeline & Ordem</h1>
          <p className="text-gray-500">Arraste para reordenar. Os conflitos são recalculados em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExportExcel} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">
            Exportar Excel
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm">
            <Download size={20} />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-1/3 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h2 className="font-serif text-xl mb-4 text-coxia-dark">Status da Sessão</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock size={20} />
                  <span>Tempo Total</span>
                </div>
                <span className="font-bold text-lg text-coxia-dark">{totalTime} min</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3 text-gray-600">
                  <AlertTriangle size={20} />
                  <span>Conflitos</span>
                </div>
                <span className={`font-bold text-lg ${currentConflicts.size > 0 ? 'text-danger' : 'text-success'}`}>
                  {currentConflicts.size}
                </span>
              </div>
            </div>
            
            {currentConflicts.size > 0 && (
              <div className="mt-4 p-4 bg-danger/10 border border-danger/20 rounded-xl">
                <h4 className="text-sm font-bold text-danger mb-1">Atenção Necessária</h4>
                <p className="text-xs text-danger/80">Existem bailarinos com tempo de troca insuficiente nesta ordem.</p>
              </div>
            )}
          </div>
        </div>

        <div className="w-2/3">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={choreos.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {choreos.map((choreo, index) => (
                <SortableItem 
                  key={choreo.id} 
                  id={choreo.id} 
                  choreo={choreo} 
                  index={index}
                  conflict={currentConflicts.get(choreo.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  )
}
