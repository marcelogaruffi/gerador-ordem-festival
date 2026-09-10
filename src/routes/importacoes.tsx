import { createFileRoute } from '@tanstack/react-router'
import React, { useState, useRef } from 'react'
import { UploadCloud, Trash2, CheckCircle2, Play, FileSpreadsheet, FileText, AlertCircle, Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import * as XLSX from 'xlsx'

export const Route = createFileRoute('/importacoes')({
  component: ImportacoesPage,
})

type QueueItem = {
  id: string
  file: File
  className: string
  choreoName: string
  status: 'pending' | 'processing' | 'success' | 'error'
  errorMsg?: string
}

function ImportacoesPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Fetch existing classes for datalist
  const { data: existingClasses } = useQuery({
    queryKey: ['classes_list'],
    queryFn: async () => {
      const { data } = await supabase.from('classes').select('id, class_code, modality')
      return data || []
    }
  })

  // Fetch existing choreographies for datalist
  const { data: existingChoreos } = useQuery({
    queryKey: ['choreos_list'],
    queryFn: async () => {
      const { data } = await supabase.from('choreographies').select('id, name')
      return data || []
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowSuccessMessage(false)
    if (e.target.files && e.target.files.length > 0) {
      const newItems: QueueItem[] = Array.from(e.target.files).map(file => ({
        id: Math.random().toString(36).substring(7),
        file,
        className: '',
        choreoName: '',
        status: 'pending'
      }))
      setQueue(prev => [...prev, ...newItems])
    }
    // Reset file input so you can select the same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const updateQueueItem = (id: string, field: 'className' | 'choreoName', value: string) => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id))
  }

  const allReady = queue.length > 0 && queue.every(q => q.status === 'success' || q.className.trim() !== '')

  const processQueue = async () => {
    if (queue.length === 0 || !allReady) return
    setIsProcessing(true)
    setShowSuccessMessage(false)

    const updatedQueue = [...queue]

    for (let i = 0; i < updatedQueue.length; i++) {
      const item = updatedQueue[i]
      if (item.status === 'success') continue

      // Mark as processing
      item.status = 'processing'
      setQueue([...updatedQueue])

      try {
        await processSingleFile(item)
        item.status = 'success'
      } catch (err: any) {
        item.status = 'error'
        item.errorMsg = err.message || 'Erro desconhecido'
      }
      setQueue([...updatedQueue])
    }

    setIsProcessing(false)
    setShowSuccessMessage(true)
    queryClient.invalidateQueries()
  }

  const processSingleFile = async (item: QueueItem) => {
    const buffer = await item.file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json<any>(worksheet)

    if (!jsonData || jsonData.length === 0) {
      throw new Error('A planilha está vazia')
    }

    const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    const rows = jsonData.map(row => {
      let nome = ''
      let celular = ''
      for (const key of Object.keys(row)) {
        const norm = normalizeKey(key)
        if (norm.includes('nome') || norm === 'aluno') nome = row[key]
        if (norm.includes('celular') || norm.includes('telefone') || norm.includes('contato')) celular = row[key]
      }
      return { nome: nome?.toString().trim(), celular: celular?.toString().trim() }
    }).filter(r => r.nome)

    if (rows.length === 0) {
      throw new Error('Nenhum aluno encontrado na coluna "Nome".')
    }

    // Class creation
    let classId = null
    const { data: searchClass } = await supabase.from('classes').select('id').eq('class_code', item.className.trim()).maybeSingle()
    if (searchClass) {
      classId = searchClass.id
    } else {
      const { data: newClass, error: classErr } = await supabase.from('classes').insert([{
        class_code: item.className.trim(),
        modality: item.className.trim(),
        days_of_week: []
      }]).select('id').single()
      if (classErr) throw new Error('Erro ao criar turma: ' + classErr.message)
      classId = newClass.id
    }

    // Choreo creation
    let choreoId = null
    if (item.choreoName.trim()) {
      const { data: searchChoreo } = await supabase.from('choreographies').select('id').eq('name', item.choreoName.trim()).maybeSingle()
      if (searchChoreo) {
        choreoId = searchChoreo.id
      } else {
        const { data: newChoreo, error: choreoErr } = await supabase.from('choreographies').insert([{
          name: item.choreoName.trim(),
          style: 'Geral',
          duration: '00:00'
        }]).select('id').single()
        if (choreoErr) throw new Error('Erro ao criar coreografia: ' + choreoErr.message)
        choreoId = newChoreo.id
      }
    }

    // Link choreo-class
    if (choreoId && classId) {
      const { data: existingLink } = await supabase.from('choreography_classes').select('id').eq('choreography_id', choreoId).eq('class_id', classId).maybeSingle()
      if (!existingLink) {
        await supabase.from('choreography_classes').insert([{ choreography_id: choreoId, class_id: classId }])
      }
    }

    // Insert Dancers
    for (const row of rows) {
      let dancerId = null
      const { data: searchDancer } = await supabase.from('dancers').select('id').ilike('name', row.nome).maybeSingle()
      if (searchDancer) {
        dancerId = searchDancer.id
        if (row.celular) {
          await supabase.from('dancers').update({ contact: row.celular }).eq('id', dancerId)
        }
      } else {
        const { data: newDancer, error: dancerErr } = await supabase.from('dancers').insert([{ name: row.nome, contact: row.celular || null }]).select('id').single()
        if (dancerErr) throw new Error(`Erro ao cadastrar ${row.nome}`)
        dancerId = newDancer.id
      }

      // Link Dancer-class
      if (dancerId && classId) {
        const { data: dancerLink } = await supabase.from('dancer_classes').select('id').eq('dancer_id', dancerId).eq('class_id', classId).maybeSingle()
        if (!dancerLink) {
          await supabase.from('dancer_classes').insert([{ dancer_id: dancerId, class_id: classId }])
        }
      }
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-coxia-dark flex items-center gap-3">
            <UploadCloud className="text-primary" size={32} />
            Importações em Lote
          </h1>
          <p className="text-gray-500 mt-1">Selecione múltiplas planilhas de uma vez, preencha as turmas e importe.</p>
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary/10 text-primary font-bold px-6 py-3 rounded-xl hover:bg-primary/20 transition-all flex items-center gap-2"
        >
          <Plus size={20} /> Selecionar Planilhas
        </button>
        <input 
          type="file" 
          multiple 
          accept=".xlsx, .xls, .csv" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {showSuccessMessage && (
        <div className="bg-success/10 border border-success/20 text-success p-6 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500 shadow-sm">
          <CheckCircle2 size={32} className="text-success shrink-0" />
          <div>
            <h3 className="font-bold text-xl text-success">Arquivos importados com sucesso!</h3>
            <p className="text-success/80 mt-1">Os alunos e turmas foram cadastrados e vinculados na base de dados.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-coxia-dark">Fila de Arquivos</h2>
          {queue.length > 0 && (
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold">
              {queue.length} arquivo(s)
            </span>
          )}
        </div>

        <datalist id="classes-list">
          {existingClasses?.map(c => <option key={c.id} value={c.class_code} />)}
        </datalist>
        <datalist id="choreos-list">
          {existingChoreos?.map(c => <option key={c.id} value={c.name} />)}
        </datalist>

        <div className="flex-1 min-h-[300px]">
          {queue.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
              <FileSpreadsheet size={48} className="mb-4 text-gray-300" />
              <p>Nenhuma planilha na fila.</p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 text-primary hover:underline text-sm font-medium"
              >
                Clique aqui para buscar arquivos
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map(item => (
                <div key={item.id} className="flex flex-col xl:flex-row xl:items-center justify-between p-5 bg-gray-50 border border-gray-100 rounded-xl gap-4">
                  
                  {/* Arquivo Info */}
                  <div className="flex items-center gap-4 w-full xl:w-1/3">
                    <div className={`p-3 rounded-full shrink-0 ${item.status === 'success' ? 'bg-success/20 text-success' : item.status === 'error' ? 'bg-danger/20 text-danger' : item.status === 'processing' ? 'bg-warning/20 text-warning-dark animate-pulse' : 'bg-primary/10 text-primary'}`}>
                      {item.status === 'success' ? <CheckCircle2 size={24} /> : item.status === 'error' ? <AlertCircle size={24} /> : <FileText size={24} />}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-gray-800 line-clamp-1 truncate" title={item.file.name}>{item.file.name}</h4>
                      {item.errorMsg && <p className="text-xs text-danger mt-1 font-medium">{item.errorMsg}</p>}
                      {item.status === 'processing' && <p className="text-xs text-warning-dark mt-1 font-medium">Lendo arquivo...</p>}
                    </div>
                  </div>

                  {/* Campos de Input */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-2/3 flex-1">
                    <div className="w-full">
                      <input 
                        type="text" 
                        list="classes-list"
                        placeholder="Nome da Turma *"
                        value={item.className}
                        onChange={(e) => updateQueueItem(item.id, 'className', e.target.value)}
                        disabled={item.status === 'processing' || item.status === 'success'}
                        className={`w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all ${item.className.trim() ? 'border-gray-200 focus:border-primary' : 'border-red-300 placeholder-red-300'}`}
                      />
                    </div>
                    <div className="w-full">
                      <input 
                        type="text" 
                        list="choreos-list"
                        placeholder="Coreografia (Opcional)"
                        value={item.choreoName}
                        onChange={(e) => updateQueueItem(item.id, 'choreoName', e.target.value)}
                        disabled={item.status === 'processing' || item.status === 'success'}
                        className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    
                    {/* Botão Remover */}
                    {item.status !== 'processing' && item.status !== 'success' && (
                      <button 
                        onClick={() => removeFromQueue(item.id)}
                        className="p-2 shrink-0 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {queue.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            {!allReady && queue.length > 0 && (
              <p className="text-sm text-red-500 mb-3 text-center font-medium flex items-center justify-center gap-2">
                <AlertCircle size={16} /> Preencha o campo "Turma" em todos os arquivos para prosseguir.
              </p>
            )}
            <button
              onClick={processQueue}
              disabled={isProcessing || !allReady || queue.every(q => q.status === 'success')}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isProcessing || !allReady || queue.every(q => q.status === 'success') ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/30'}`}
            >
              <Play size={20} />
              {isProcessing ? 'Processando Fila...' : 'Iniciar Importação de Todos os Arquivos'}
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
