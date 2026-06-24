import React from 'react'
import { Bell, Search } from 'lucide-react'

export function Header() {
  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar bailarinos, coreografias..." 
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-gray-400 hover:text-primary transition-colors">
          <Bell size={24} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l border-gray-100 pl-6 cursor-pointer group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors">Marcelo Formigoni</p>
            <p className="text-xs text-gray-500">Administrador</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-serif text-lg border border-primary/20">
            MF
          </div>
        </div>
      </div>
    </header>
  )
}
