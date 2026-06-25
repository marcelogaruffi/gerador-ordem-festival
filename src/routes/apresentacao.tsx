import { createFileRoute, Link } from '@tanstack/react-router'
import React, { useState, useEffect } from 'react'
import { Play, Pause, SkipForward, SkipBack, Maximize, Minimize, X, Calendar, FolderOpen, Music } from 'lucide-react'
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

  // Local Audio states
  const [dirHandle, setDirHandle] = useState<any>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)

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

  // Handle local folder selection
  const handleSelectFolder = async () => {
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker()
      setDirHandle(handle)
    } catch (err) {
      console.log('Seleção de pasta cancelada', err)
    }
  }

  // Fetch audio file when choreography changes
  useEffect(() => {
    async function loadAudio() {
      if (!dirHandle) {
        setAudioUrl(null)
        setAudioDuration(0)
        return
      }
      try {
        let foundFile: File | null = null
        const expectedOrder = currentIndex + 1

        // @ts-ignore
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const name = entry.name.toLowerCase()
            // Look for exactly "1.mp3", "1 -", "01-", etc.
            const match = name.match(/^0*(\d+)/)
            if (match && parseInt(match[1]) === expectedOrder) {
              foundFile = await entry.getFile()
              break
            }
          }
        }

        if (foundFile) {
          const url = URL.createObjectURL(foundFile)
          setAudioUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return url
          })
        } else {
          setAudioUrl(prev => {
            if (prev) URL.revokeObjectURL(prev)
            return null
          })
          setAudioDuration(0)
        }
      } catch (err) {
        console.error("Erro ao carregar áudio:", err)
        setAudioUrl(null)
        setAudioDuration(0)
      }
    }
    loadAudio()
  }, [currentIndex, dirHandle])

  // Initialize time when currentChoreo changes
  useEffect(() => {
    if (currentChoreo) {
      if (!audioUrl) {
        setTimeLeft(parseDuration(currentChoreo.duration))
      }
      setIsPlaying(false)
    }
  }, [currentIndex, currentChoreo, audioUrl])

  // Timer logic for manual countdown (when no audio is loaded)
  useEffect(() => {
    if (audioUrl) return // if we have audio, timer is synced to audio element

    let interval: any
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false)
    }
    return () => clearInterval(interval)
  }, [isPlaying, timeLeft, audioUrl])

  // Sync isPlaying with audio element
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error('Audio play blocked:', e)
          setIsPlaying(false)
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, audioUrl])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = Math.floor(audioRef.current.currentTime)
      const duration = Math.floor(audioRef.current.duration) || 0
      setAudioDuration(duration)
      setTimeLeft(Math.max(0, duration - current))
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
    setTimeLeft(0)
  }

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
              
              <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl mb-8 flex flex-col items-center gap-4 text-center">
                <Music className="text-gray-500" size={32} />
                <div>
                  <h3 className="font-bold text-white mb-1">Áudio Local (Opcional)</h3>
                  <p className="text-sm text-gray-400">Selecione a pasta do seu computador onde estão as músicas. Elas devem começar com o número da ordem (ex: 1.mp3, 2.mp3).</p>
                </div>
                <button 
                  onClick={handleSelectFolder}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${dirHandle ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                >
                  <FolderOpen size={20} />
                  {dirHandle ? 'Pasta Conectada' : 'Selecionar Pasta de Músicas'}
                </button>
              </div>

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
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleAudioEnded}
          onLoadedMetadata={handleTimeUpdate}
        />
      )}
      
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
              {formatTime(audioUrl ? audioDuration - timeLeft : parseDuration(currentChoreo?.duration) - timeLeft)}
            </div>
          </div>

          <div className="hidden md:block w-px h-48 bg-gray-800"></div>

          {/* Cronômetro Regressivo */}
          <div className="flex flex-col items-center flex-1 relative">
            {dirHandle && (
              <div className="absolute -top-12 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-sm">
                <Music size={14} className={audioUrl ? "text-primary" : "text-gray-500"} />
                <span className={audioUrl ? "text-primary font-medium" : "text-gray-500"}>
                  {audioUrl ? 'Áudio Vinculado' : 'Sem Áudio (1.mp3)'}
                </span>
              </div>
            )}
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
