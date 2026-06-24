import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { Settings, Save, Database, Bell, Palette, Download, Upload, Shield } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/configuracoes')({
  component: SettingsPage,
})

function SettingsPage() {
  const queryClient = useQueryClient()
  
  const [tolerance, setTolerance] = useState('1')
  const [theme, setTheme] = useState('light')
  const [notifications, setNotifications] = useState(true)

  // Fetch Settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single()
      if (error && error.code !== 'PGRST116') throw error
      return data || { tolerance: 1, notifications: true, theme: 'light' }
    }
  })

  // Pre-fill state when data arrives
  useEffect(() => {
    if (currentSettings) {
      setTolerance(currentSettings.tolerance.toString())
      setNotifications(currentSettings.notifications)
      setTheme(currentSettings.theme)
    }
  }, [currentSettings])

  // Save Settings Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        id: 1,
        tolerance: parseInt(tolerance, 10),
        notifications,
        theme,
        updated_at: new Date().toISOString()
      }
      const { error } = await supabase.from('settings').upsert(payload)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard_timeline'] }) // Invalidate dependent queries
      queryClient.invalidateQueries({ queryKey: ['timeline'] })
      alert('Configurações salvas com sucesso no banco de dados!')
    },
    onError: (err: any) => {
      alert(`Erro ao salvar configurações: ${err.message || err}`)
    }
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate()
  }

  const handleExportDB = async () => {
    try {
      const { data: dancers } = await supabase.from('dancers').select('*')
      if (!dancers) return
      
      let csv = "ID;Nome;Data_Nascimento;Contato;Status\n"
      dancers.forEach(d => {
        csv += `"${d.id}";"${d.name}";"${d.birth_date || ''}";"${d.contact || ''}";"${d.status}"\n`
      })
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `Coxia_Backup_Bailarinos_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert("Erro ao exportar banco de dados")
    }
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Carregando configurações...</div>
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Configurações</h1>
          <p className="text-gray-500">Ajuste as preferências e o comportamento do sistema Coxia.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Menu Lateral de Configurações */}
        <div className="md:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary text-white font-medium shadow-md shadow-primary/20 transition-all">
            <Settings size={20} /> Geral e Conflitos
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white text-gray-600 font-medium transition-all cursor-not-allowed opacity-60">
            <Palette size={20} /> Aparência (Em Breve)
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white text-gray-600 font-medium transition-all cursor-not-allowed opacity-60">
            <Database size={20} /> Backup de Dados (Em Breve)
          </button>
        </div>

        {/* Painel Principal */}
        <div className="md:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-serif font-bold text-gray-800 mb-4">Geral e Detecção de Conflitos</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tolerância de Troca de Figurino
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Define quantas coreografias de intervalo um bailarino precisa ter para não gerar o alerta amarelo (Troca Corrida). Ex: Se escolher 1, bailarinos com apenas 1 dança de intervalo serão sinalizados.
                  </p>
                  <select 
                    value={tolerance}
                    onChange={(e) => setTolerance(e.target.value)}
                    className="w-full md:w-1/2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-800"
                  >
                    <option value="0">0 Intervalos (Sinalizar Qualquer Troca)</option>
                    <option value="1">1 Intervalo</option>
                    <option value="2">2 Intervalos</option>
                    <option value="3">3 Intervalos</option>
                  </select>
                </div>

                <hr className="border-gray-100" />

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="block text-sm font-medium text-gray-700">Notificações Visuais</span>
                      <span className="block text-xs text-gray-500">Habilitar avisos pop-up no sistema.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end gap-3">
              <button 
                type="submit" 
                disabled={saveMutation.isPending}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
              >
                <Save size={20} />
                {saveMutation.isPending ? 'Salvando...' : 'Salvar no Banco de Dados'}
              </button>
            </div>
          </form>

          {/* Area de Risco */}
          <div className="mt-6 bg-white rounded-2xl border border-danger/20 shadow-sm overflow-hidden p-6">
            <h2 className="text-lg font-serif font-bold text-danger mb-2">Segurança e Dados</h2>
            <p className="text-sm text-gray-600 mb-4">Mantenha os dados dos seus alunos seguros fazendo backups periódicos.</p>
            
            <div className="flex flex-wrap gap-4">
              <button onClick={handleExportDB} type="button" className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm">
                <Download size={16} /> Exportar Bailarinos (.CSV)
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
