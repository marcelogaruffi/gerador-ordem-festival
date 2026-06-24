import { createFileRoute } from '@tanstack/react-router'
import React from 'react'
import { AlertTriangle, Info } from 'lucide-react'

export const Route = createFileRoute('/conflitos')({
  component: ConflitosPage,
})

function ConflitosPage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif text-coxia-dark mb-1">Mapa de Conflitos</h1>
        <p className="text-gray-500">Analise os tempos de troca e espaçamento entre as coreografias.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-warning/10 text-warning rounded-2xl flex items-center justify-center mb-6">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-serif text-coxia-dark mb-2">Motor de Conflitos</h2>
        <p className="text-gray-500 max-w-lg mb-8">
          Esta funcionalidade fará parte da próxima fase. Aqui você poderá visualizar uma matriz completa de quem não tem tempo suficiente para trocar de figurino.
        </p>

        <div className="flex gap-4 items-center justify-center text-sm font-medium">
          <div className="flex items-center gap-2 text-success">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            Sem conflitos
          </div>
          <div className="flex items-center gap-2 text-warning">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            Atenção (Troca Rápida)
          </div>
          <div className="flex items-center gap-2 text-danger">
            <div className="w-3 h-3 rounded-full bg-danger"></div>
            Grave (Impossível)
          </div>
        </div>
      </div>
    </div>
  )
}
