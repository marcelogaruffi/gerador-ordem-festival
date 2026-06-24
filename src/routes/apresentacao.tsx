import { createFileRoute, Link } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { Play, Pause, SkipForward, SkipBack, Maximize, Minimize, X, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/apresentacao')({
  component: ApresentacaoPage,
})

function ApresentacaoPage() {
  const [selectedFestival, setSelectedFestival] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 1. Fetch Festivals
  const { data: festivals, isLoading: isFestivalsLoading } = useQuery({
    queryKey: ['festivals_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('festivals').select('*').order('created_at')
      if (error) throw error
      return data
    }
  })

  // 2. Fetch Timeline Data
  const { data: timelineItems, isLoading: isTimelineLoading } = useQuery({
    queryKey: ['timeline_apresentacao', selectedFestival],
    queryFn: async () => {
      if (!selectedFestival) return []
      const { data, error } = await supabase
        .from('festival_choreographies')
        .select(`
          order_index,
          choreographies (
            name,
            style,
            duration
          )
        `)
        .eq('festival_id', selectedFestival)
        .order('order_index', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: !!selectedFestival
  })

  const order = timelineItems || []
  const currentChoreo = order[currentIndex]?.choreographies
  const nextChoreo = order[currentIndex + 1]?.choreographies

  // Helper to parse MM:SS
  const parseDuration = (durationStr?: string) => {
    if (!durationStr) return 0
    const [m, s] = durationStr.split(':').map(Number)
    return (m || 0) * 60 + (s || 0)
  }

  // Initialize time when currentChoreo changes
  useEffect(() => {
    if (currentChoreo) {
      setTimeLeft(parseDuration(currentChoreo.duration))
      setIsPlaying(false)
    }
  }, [currentIndex, currentChoreo])

  // Timer logic
  useEffect(() => {
    let interval: any
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsPlaying(false)
    }
    return () => clearInterval(interval)
  }, [isPlaying, timeLeft])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Erro ao tentar entrar em fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Exit presentation mode
  const handleExit = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleNext = () => {
    if (currentIndex < order.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // --- STAGE 1: Selection Screen ---
  if (!selectedFestival) {
    return (
      <div className="fixed inset-0 bg-coxia-dark text-white z-50 flex flex-col items-center justify-center p-8">
        <Link to="/" className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
          <X size={24} /> Voltar ao Painel
        </Link>
        
        <div className="text-center max-w-md w-full">
          <Play className="mx-auto text-primary mb-6" size={64} />
          <h1 className="text-4xl font-serif text-white mb-2">Modo Apresentação</h1>
          <p className="text-gray-400 mb-12">Selecione o festival que deseja iniciar no palco.</p>

          {isFestivalsLoading ? (
            <div className="text-gray-500">Carregando festivais...</div>
          ) : festivals?.length === 0 ? (
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 text-gray-400">
              Nenhum festival cadastrado.
            </div>
          ) : (
            <div className="space-y-4">
              {festivals?.map(fest => (
                <button
                  key={fest.id}
                  onClick={() => setSelectedFestival(fest.id)}
                  className="w-full bg-gray-900 hover:bg-primary/20 border border-gray-800 hover:border-primary text-left p-6 rounded-2xl transition-all group flex items-center gap-4"
                >
                  <Calendar className="text-primary" />
                  <div>
                    <h3 className="font-bold text-xl text-white group-hover:text-primary transition-colors">{fest.name}</h3>
                    <p className="text-gray-400 text-sm">{fest.city ? `${fest.city} - ` : ''} {fest.start_date ? new Date(fest.start_date).toLocaleDateString() : 'Sem data'}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- STAGE 2: Presentation Screen ---
  if (isTimelineLoading) {
    return <div className="fixed inset-0 bg-black text-white flex items-center justify-center">Carregando show...</div>
  }

  if (order.length === 0) {
    return (
      <div className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center">
        <p className="text-2xl text-gray-400 mb-6">Este festival ainda não tem coreografias na Timeline.</p>
        <button onClick={() => setSelectedFestival(null)} className="text-primary hover:underline">Voltar</button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col font-sans animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="p-8 flex justify-between items-center border-b border-gray-900">
        <div className="flex items-center gap-6">
          <Link to="/" onClick={handleExit} className="p-3 rounded-xl bg-gray-900 hover:bg-danger/20 hover:text-danger text-gray-400 transition-colors" title="Sair do Modo Apresentação">
            <X size={24} />
          </Link>
          <h1 className="text-3xl font-serif text-primary tracking-widest font-bold">COXIA</h1>
        </div>
        
        <div className="flex items-center gap-4 text-gray-400 font-medium">
          <span>{currentIndex + 1} de {order.length}</span>
          <button onClick={toggleFullscreen} className="p-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition-colors">
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        
        <p className="text-xl text-primary font-bold tracking-widest uppercase mb-4">No Palco Agora</p>
        <h2 className="text-7xl font-serif font-bold mb-4">{currentChoreo?.name}</h2>
        <p className="text-3xl text-gray-400 mb-16">{currentChoreo?.style || 'Sem estilo'} </p>

        <div className="flex flex-col md:flex-row gap-12 md:gap-32 items-center justify-center mb-12 w-full max-w-6xl mx-auto">
          {/* Cronômetro Progressivo */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-gray-500 uppercase tracking-widest text-xl mb-4 font-bold">Decorrido</span>
            <div className="text-[8rem] md:text-[10rem] font-bold leading-none tabular-nums text-white drop-shadow-2xl">
              {formatTime(parseDuration(currentChoreo?.duration) - timeLeft)}
            </div>
          </div>

          <div className="hidden md:block w-px h-48 bg-gray-800"></div>

          {/* Cronômetro Regressivo */}
          <div className="flex flex-col items-center flex-1">
            <span className="text-gray-500 uppercase tracking-widest text-xl mb-4 font-bold">Restante</span>
            <div className="text-[8rem] md:text-[10rem] font-bold leading-none tabular-nums text-primary drop-shadow-2xl">
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-8">
          <button onClick={handlePrev} disabled={currentIndex === 0} className="p-6 rounded-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 transition-all">
            <SkipBack size={32} />
          </button>
          
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-8 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            {isPlaying ? <Pause size={48} /> : <Play size={48} className="ml-2" />}
          </button>

          <button onClick={handleNext} disabled={currentIndex === order.length - 1} className="p-6 rounded-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 transition-all">
            <SkipForward size={32} />
          </button>
        </div>
      </div>

      {/* Footer / Next Up */}
      <div className="bg-gray-900/50 p-8 flex justify-between items-center">
        {nextChoreo ? (
          <div>
            <p className="text-sm text-gray-500 font-bold tracking-wider uppercase mb-1">Próxima Coreografia</p>
            <p className="text-2xl font-serif text-gray-200">{nextChoreo.name}</p>
          </div>
        ) : (
          <div>
            <p className="text-xl font-serif text-gray-500">Fim do Espetáculo</p>
          </div>
        )}
      </div>

    </div>
  )
}
