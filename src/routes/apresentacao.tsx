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
  const [role, setRole] = useState<'operator' | 'viewer' | null>(null)
  const channelRef = React.useRef<any>(null)

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
            duration,
            choreography_classes (
              classes (
                modality
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

  const order = timelineItems || []
  const currentChoreo = order[currentIndex]?.choreographies
  const nextChoreo = order[currentIndex + 1]?.choreographies

  // Helper to parse MM:SS
  const parseDuration = (durationStr?: string) => {
    if (!durationStr) return 0
    const [m, s] = durationStr.split(':').map(Number)
    return (m || 0) * 60 + (s || 0)
  }

  // Helper to get class names
  const getChoreoClasses = (choreo: any) => {
    if (!choreo?.choreography_classes || choreo.choreography_classes.length === 0) return 'Sem turma vinculada'
    return choreo.choreography_classes.map((cc: any) => cc.classes?.modality).join(', ')
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
    if (audioUrl || role === 'viewer') return // if we have audio or are viewer, timer is handled elsewhere

    let interval: any
    if (isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false)
    }
    return () => clearInterval(interval)
  }, [isPlaying, timeLeft, audioUrl, role])

  // Broadcast state to viewers
  useEffect(() => {
    if (role === 'operator' && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'playback_sync',
        payload: { currentIndex, isPlaying, timeLeft }
      }).catch(console.error)
    }
  }, [currentIndex, isPlaying, timeLeft, role])

  // Setup Supabase Realtime Channel
  useEffect(() => {
    if (!selectedFestival || !role) return

    const channel = supabase.channel(`festival_${selectedFestival}`)
    channelRef.current = channel

    if (role === 'viewer') {
      channel.on('broadcast', { event: 'playback_sync' }, (payload: any) => {
        const { currentIndex: newIndex, isPlaying: newPlaying, timeLeft: newTimeLeft } = payload.payload
        setCurrentIndex(newIndex)
        setIsPlaying(newPlaying)
        setTimeLeft(newTimeLeft)
      }).subscribe()
    } else if (role === 'operator') {
      channel.subscribe()
    }

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [selectedFestival, role])

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

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setTimeLeft(Math.max(0, audioDuration - newTime))
    } else {
      const duration = parseDuration(currentChoreo?.duration) || 0
      setTimeLeft(Math.max(0, duration - newTime))
    }
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
    setRole(null) // Reset role when exiting
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

  // --- STAGE 1.5: Role Selection Screen ---
  if (selectedFestival && !role) {
    return (
      <div className="fixed inset-0 bg-coxia-dark text-white z-50 flex flex-col items-center justify-center p-8">
        <button onClick={() => setSelectedFestival(null)} className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors flex items-center gap-2">
          <X size={24} /> Voltar aos Festivais
        </button>
        
        <div className="text-center max-w-4xl w-full">
          <h1 className="text-4xl font-serif text-white mb-2">Escolha seu Papel</h1>
          <p className="text-gray-400 mb-12">Como você deseja operar esta tela?</p>

          <div className="flex flex-col md:flex-row gap-8 justify-center">
            {/* Operator Card */}
            <button 
              onClick={() => setRole('operator')}
              className="flex-1 bg-gray-900 hover:bg-primary/20 border border-gray-800 hover:border-primary p-8 rounded-3xl transition-all flex flex-col items-center gap-6 group text-center"
            >
              <div className="p-6 bg-gray-800 group-hover:bg-primary/20 rounded-full text-white group-hover:text-primary transition-colors shadow-xl">
                <Play size={64} className="ml-2" />
              </div>
              <div>
                <h3 className="font-bold text-3xl text-white mb-2">Operador</h3>
                <p className="text-gray-400">Controla o som, luz e passa as coreografias. Comanda o show inteiro.</p>
              </div>
            </button>

            {/* Viewer Card */}
            <button 
              onClick={() => setRole('viewer')}
              className="flex-1 bg-gray-900 hover:bg-primary/20 border border-gray-800 hover:border-primary p-8 rounded-3xl transition-all flex flex-col items-center gap-6 group text-center"
            >
              <div className="p-6 bg-gray-800 group-hover:bg-primary/20 rounded-full text-white group-hover:text-primary transition-colors shadow-xl">
                <Maximize size={64} />
              </div>
              <div>
                <h3 className="font-bold text-3xl text-white mb-2">Telão / Coxia</h3>
                <p className="text-gray-400">Apenas visualiza a ordem e o cronômetro sincronizado pelo Operador. Ideal para TV no backstage.</p>
              </div>
            </button>
          </div>
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
          <h1 className="text-3xl font-serif text-primary tracking-widest font-bold">
            COXIA <span className="text-gray-600 text-xl font-normal ml-2 tracking-normal">[{role === 'operator' ? 'Operador' : 'Visualizador'}]</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4 text-gray-400 font-medium">
          <span>{currentIndex + 1} de {order.length}</span>
          <button onClick={toggleFullscreen} className="p-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white transition-colors">
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </button>
        </div>
      </div>

      {role === 'operator' ? (
        <>
          {/* Main Content (OPERATOR) */}
          <div className="flex-1 flex flex-col p-12">
            
            {/* Top Bar: Connect Folder */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-sm text-primary font-bold tracking-widest uppercase mb-2">No Palco Agora</p>
                <h2 className="text-5xl font-serif font-bold mb-2">{currentChoreo?.name}</h2>
                <p className="text-xl text-gray-400">{getChoreoClasses(currentChoreo)} </p>
              </div>
              
              <button 
                onClick={handleSelectFolder}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${dirHandle ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-900 text-gray-300 hover:bg-gray-800 border border-gray-800 hover:border-primary'}`}
              >
                <FolderOpen size={18} />
                {dirHandle ? 'Pasta Conectada' : 'Selecionar Pasta de Músicas'}
              </button>
            </div>

            {/* Dashboard Player */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-4xl w-full mx-auto shadow-2xl">
              
              {/* Audio Status */}
              <div className="flex items-center justify-center gap-2 mb-6 text-sm">
                <Music size={16} className={audioUrl ? "text-primary" : "text-gray-500"} />
                <span className={audioUrl ? "text-primary font-medium" : "text-gray-500"}>
                  {audioUrl ? 'Áudio Vinculado e Pronto' : (dirHandle ? `Procurando arquivo ${currentIndex + 1}.mp3...` : 'Sem Áudio (Conecte uma pasta)')}
                </span>
              </div>

              {/* Scrubber & Timers */}
              <div className="flex items-center gap-6 mb-8 w-full">
                <span className="text-2xl font-bold tabular-nums text-gray-300 w-24 text-right">
                  {formatTime(audioUrl ? audioDuration - timeLeft : parseDuration(currentChoreo?.duration) - timeLeft)}
                </span>
                
                <input 
                  type="range" 
                  min="0" 
                  max={audioDuration || parseDuration(currentChoreo?.duration) || 100}
                  value={audioDuration ? audioDuration - timeLeft : parseDuration(currentChoreo?.duration) - timeLeft}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="flex-1 h-3 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80 transition-all"
                />

                <span className="text-2xl font-bold tabular-nums text-primary w-24">
                  -{formatTime(timeLeft)}
                </span>
              </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-8">
              <button onClick={handlePrev} disabled={currentIndex === 0} className="p-6 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 transition-all text-white">
                <SkipBack size={32} />
              </button>
              
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-8 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 hover:scale-105 transition-all"
              >
                {isPlaying ? <Pause size={48} /> : <Play size={48} className="ml-2" />}
              </button>

              <button onClick={handleNext} disabled={currentIndex === order.length - 1} className="p-6 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 transition-all text-white">
                <SkipForward size={32} />
              </button>
            </div>
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
        </>
      ) : (
        <>
          {/* Main Content (VIEWER / COXIA) */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Side: Current Choreo & Timer */}
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center border-r border-gray-900">
              <p className="text-2xl text-primary font-bold tracking-widest uppercase mb-4 flex items-center gap-4">
                {isPlaying && <span className="w-4 h-4 bg-primary rounded-full animate-pulse"></span>}
                No Palco Agora
              </p>
              <h2 className="text-8xl font-serif font-bold mb-6 text-white leading-tight">{currentChoreo?.name}</h2>
              <p className="text-4xl text-gray-400 mb-20">{getChoreoClasses(currentChoreo)} </p>

              <div className="flex flex-col items-center w-full">
                <span className="text-gray-500 uppercase tracking-widest text-2xl mb-6 font-bold">Tempo Restante</span>
                <div className={`text-[15rem] font-bold leading-none tabular-nums drop-shadow-2xl transition-colors duration-1000 ${timeLeft <= 10 && timeLeft > 0 ? 'text-danger animate-pulse' : 'text-primary'}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
            </div>

            {/* Right Side: Next Up List */}
            <div className="w-[30%] bg-gray-900/30 p-12 flex flex-col">
              <p className="text-xl text-gray-500 font-bold tracking-widest uppercase mb-12">Próximas Coreografias</p>
              <div className="flex flex-col gap-8">
                {order.slice(currentIndex + 1, currentIndex + 4).map((item, idx) => (
                  <div key={item.order_index} className="flex flex-col border-l-4 border-gray-800 pl-6 py-2">
                    <span className="text-gray-500 font-bold mb-1">#{item.order_index}</span>
                    <h3 className="text-3xl font-serif text-white mb-2">{item.choreographies.name}</h3>
                    <p className="text-xl text-gray-400">{getChoreoClasses(item.choreographies)}</p>
                  </div>
                ))}
                
                {currentIndex + 1 >= order.length && (
                  <div className="text-center text-gray-600 mt-12">
                    <p className="text-2xl font-serif">Fim do Espetáculo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
