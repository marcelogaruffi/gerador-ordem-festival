import { createFileRoute } from '@tanstack/react-router'
import React, { useState } from 'react'
import { Link2, Trash2, Plus } from 'lucide-react'

export const Route = createFileRoute('/vinculos')({
  component: VinculosPage,
})

function VinculosPage() {
  const [participations, setParticipations] = useState([
    { id: 1, dancer: 'Alice Silva', choreography: 'Abertura Mágica', level: 'Infantil' },
    { id: 2, dancer: 'Beatriz Costa', choreography: 'Abertura Mágica', level: 'Adulto' },
    { id: 3, dancer: 'Beatriz Costa', choreography: 'Jazz Contemporâneo', level: 'Adulto' },
    { id: 4, dancer: 'Carlos Santos', choreography: 'Sincronia Urbana', level: 'Avançado' },
  ])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Vínculos de Participação</h1>
          <p className="text-gray-500">Vincule os bailarinos às coreografias que eles irão dançar.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
          <Link2 className="text-primary" /> Novo Vínculo
        </h2>
        
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Bailarino</label>
            <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              <option value="">Buscar bailarino...</option>
              <option value="1">Alice Silva</option>
              <option value="2">Beatriz Costa</option>
              <option value="3">Carlos Santos</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecione a Coreografia</label>
            <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all">
              <option value="">Buscar coreografia...</option>
              <option value="c1">Abertura Mágica</option>
              <option value="c2">Jazz Contemporâneo</option>
              <option value="c3">Sincronia Urbana</option>
            </select>
          </div>
          <button className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm h-[46px]">
            <Plus size={20} />
            Vincular
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-medium text-gray-700">Vínculos Ativos</h3>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-gray-400 text-sm border-b border-gray-100">
              <th className="px-6 py-3 font-medium">Bailarino</th>
              <th className="px-6 py-3 font-medium">Coreografia</th>
              <th className="px-6 py-3 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {participations.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-semibold text-gray-800 block">{p.dancer}</span>
                  <span className="text-xs text-gray-500">{p.level}</span>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {p.choreography}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-danger/70 hover:bg-danger/10 hover:text-danger transition-colors rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
