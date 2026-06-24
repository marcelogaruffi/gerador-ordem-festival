import { createFileRoute, Link } from '@tanstack/react-router'
import React from 'react'
import { Calendar, Users, Music, Shirt, PlaySquare, ChevronRight, GraduationCap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/')({
  component: Dashboard,
})

function Dashboard() {
  const { data: nextFestival } = useQuery({
    queryKey: ['dashboard_next_festival'],
    queryFn: async () => {
      const { data } = await supabase
        .from('festivals')
        .select('*')
        .order('start_date', { ascending: true })
        .limit(1)
        .single()
      return data
    }
  })

  // Fetch timeline for nextFestival to calculate conflicts
  const { data: timelineItems } = useQuery({
    queryKey: ['dashboard_timeline', nextFestival?.id],
    queryFn: async () => {
      if (!nextFestival) return []
      const { data, error } = await supabase
        .from('festival_choreographies')
        .select(`
          order_index,
          choreographies (
            name,
            choreography_dancers (
              dancers (
                name
              )
            )
          )
        `)
        .eq('festival_id', nextFestival.id)
        .order('order_index', { ascending: true })
      
      if (error) throw error
      return data
    },
    enabled: !!nextFestival
  })

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('tolerance').eq('id', 1).single()
      return data || { tolerance: 1 }
    }
  })

  const { data: stats } = useQuery({
    queryKey: ['dashboard_stats'],
    queryFn: async () => {
      const [
        { count: dancersCount },
        { count: classesCount },
        { count: choreosCount },
        { count: costumesCount }
      ] = await Promise.all([
        supabase.from('dancers').select('*', { count: 'exact', head: true }),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('choreographies').select('*', { count: 'exact', head: true }),
        supabase.from('costumes').select('*', { count: 'exact', head: true })
      ])
      return {
        dancers: dancersCount || 0,
        classes: classesCount || 0,
        choreos: choreosCount || 0,
        costumes: costumesCount || 0
      }
    }
  })


  const statCards = [
    { label: 'Bailarinos Ativos', value: stats?.dancers ?? '-', icon: Users, color: 'bg-primary/10 text-primary' },
    { label: 'Turmas/Aulas', value: stats?.classes ?? '-', icon: GraduationCap, color: 'bg-coxia-light/30 text-coxia-dark' },
    { label: 'Coreografias', value: stats?.choreos ?? '-', icon: Music, color: 'bg-warning/10 text-warning-dark' },
    { label: 'Peças de Figurino', value: stats?.costumes ?? '-', icon: Shirt, color: 'bg-success/10 text-success' },
  ]

  // Calcula conflitos da timeline
  const conflictsStats = React.useMemo(() => {
    let red = 0
    let yellow = 0
    if (!timelineItems) return { red, yellow }
    
    const tolerance = settings?.tolerance ?? 1

    timelineItems.forEach((item, index) => {
      if (index === 0) return
      const currentDancers = item.choreographies?.choreography_dancers?.map((c: any) => c.dancers?.name).filter(Boolean) || []
      
      const prev1 = timelineItems[index - 1]
      const prev1Dancers = prev1?.choreographies?.choreography_dancers?.map((c: any) => c.dancers?.name).filter(Boolean) || []
      const intersection1 = currentDancers.filter((d: string) => prev1Dancers.includes(d))
      
      if (intersection1.length > 0) {
        red++
        return // Já marcou vermelho, não testa amarelo
      }

      for (let t = 2; t <= tolerance + 1; t++) {
        if (index >= t) {
          const prevT = timelineItems[index - t]
          const prevTDancers = prevT?.choreographies?.choreography_dancers?.map((c: any) => c.dancers?.name).filter(Boolean) || []
          const intersectionT = currentDancers.filter((d: string) => prevTDancers.includes(d))
          if (intersectionT.length > 0) {
            yellow++
            break // conta 1 amarelo por coreografia no máximo
          }
        }
      }
    })

    return { red, yellow }
  }, [timelineItems, settings])

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark mb-1">Visão Geral</h1>
          <p className="text-gray-500">Acompanhe os números da sua escola e do seu próximo espetáculo.</p>
        </div>
        <Link 
          to="/apresentacao" 
          className="bg-primary text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 font-medium"
        >
          <PlaySquare size={20} />
          Modo Apresentação
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-serif font-bold text-gray-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Next Festival & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
          
          <h2 className="text-xl font-serif font-bold text-gray-800 mb-6 flex items-center gap-2 relative z-10">
            <Calendar className="text-primary" /> Próximo Espetáculo
          </h2>
          
          {nextFestival ? (
            <div className="relative z-10">
              <h3 className="text-4xl font-serif text-primary font-bold mb-2">{nextFestival.name}</h3>
              <p className="text-gray-500 text-lg mb-8">
                {nextFestival.start_date ? new Date(nextFestival.start_date).toLocaleDateString('pt-BR') : 'Data a definir'} 
                {nextFestival.city ? ` • ${nextFestival.city}` : ''}
              </p>
              
              <div className="flex gap-4 mb-6">
                <Link to="/timeline" className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
                  <ListOrderedIcon size={20} /> Abrir Timeline
                </Link>
              </div>

              {/* Conflitos Card */}
              {timelineItems && timelineItems.length > 0 && (
                <div className="flex gap-4">
                  <div className={`flex-1 p-4 rounded-xl border flex items-center gap-4 ${conflictsStats.red > 0 ? 'bg-danger/5 border-danger/20' : 'bg-success/5 border-success/20'}`}>
                    <div className={`p-3 rounded-full ${conflictsStats.red > 0 ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                      {conflictsStats.red > 0 ? <AlertTriangleIcon size={24} /> : <CheckCircleIcon size={24} />}
                    </div>
                    <div>
                      <h4 className={`font-bold ${conflictsStats.red > 0 ? 'text-danger' : 'text-success'}`}>
                        {conflictsStats.red > 0 ? `${conflictsStats.red} Trocas Urgentes!` : 'Nenhum conflito vermelho!'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {conflictsStats.red > 0 ? 'Bailarinos dançando em coreografias seguidas.' : 'Elenco com tempo de troca.'}
                      </p>
                    </div>
                  </div>

                  {conflictsStats.yellow > 0 && (
                    <div className="flex-1 p-4 rounded-xl border bg-warning/5 border-warning/20 flex items-center gap-4">
                      <div className="p-3 rounded-full bg-warning/10 text-warning-dark">
                        <AlertTriangleIcon size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-warning-dark">{conflictsStats.yellow} Trocas Corridas</h4>
                        <p className="text-sm text-gray-600">Apenas 1 dança de intervalo.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 relative z-10">
              <p className="text-gray-500 mb-4">Você ainda não criou nenhum festival.</p>
              <Link to="/festivais" className="text-primary font-medium hover:underline">Criar primeiro festival</Link>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-xl font-serif font-bold text-gray-800 mb-6">Ações Rápidas</h2>
          
          <div className="flex flex-col gap-3 flex-1 justify-center">
            <Link to="/bailarinos" className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group">
              <div className="flex items-center gap-3 text-gray-700 group-hover:text-primary">
                <Users size={20} />
                <span className="font-medium">Cadastrar Aluno</span>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-primary" />
            </Link>
            
            <Link to="/coreografias" className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group">
              <div className="flex items-center gap-3 text-gray-700 group-hover:text-primary">
                <Music size={20} />
                <span className="font-medium">Nova Coreografia</span>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-primary" />
            </Link>

            <Link to="/figurinos" className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all group">
              <div className="flex items-center gap-3 text-gray-700 group-hover:text-primary">
                <Shirt size={20} />
                <span className="font-medium">Acervo de Figurinos</span>
              </div>
              <ChevronRight size={18} className="text-gray-400 group-hover:text-primary" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function ListOrderedIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="10" x2="21" y1="6" y2="6"/>
      <line x1="10" x2="21" y1="12" y2="12"/>
      <line x1="10" x2="21" y1="18" y2="18"/>
      <path d="M4 6h1v4"/>
      <path d="M4 10h2"/>
      <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
    </svg>
  )
}

function AlertTriangleIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" x2="12" y1="9" y2="13"/>
      <line x1="12" x2="12.01" y1="17" y2="17"/>
    </svg>
  )
}

function CheckCircleIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  )
}
