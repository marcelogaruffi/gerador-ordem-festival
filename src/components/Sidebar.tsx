import React, { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { LayoutDashboard, Calendar, Users, Music, Shirt, AlertTriangle, Settings, LogOut, ListOrdered, PlaySquare, Link2, GraduationCap, UserCheck, DollarSign, Wallet, ChevronDown, ChevronRight, PieChart } from 'lucide-react'

export function Sidebar() {
  const location = useLocation()
  const [isFinanceOpen, setIsFinanceOpen] = useState(location.pathname.includes('/pagamentos') || location.pathname.includes('/caixa'))

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/festivais', icon: Calendar, label: 'Festivais' },
    { to: '/bailarinos', icon: Users, label: 'Bailarinos' },
    { to: '/professores', icon: UserCheck, label: 'Professores' },
    { to: '/aulas', icon: GraduationCap, label: 'Aulas' },
    { to: '/coreografias', icon: Music, label: 'Coreografias' },
    { to: '/figurinos', icon: Shirt, label: 'Figurinos' },
    { to: '/timeline', icon: ListOrdered, label: 'Timeline' },
    { to: '/apresentacao', icon: PlaySquare, label: 'Apresentação' },
  ]

  return (
    <aside className="w-64 bg-coxia-dark text-white flex flex-col h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-3xl font-serif font-bold text-primary tracking-wider">COXIA</h1>
        <p className="text-gray-400 text-xs mt-1 italic">Inteligência em Dança</p>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-primary/20 hover:text-primary text-gray-300"
            activeProps={{ className: 'bg-primary text-white hover:bg-primary hover:text-white' }}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}

        {/* Gestão Financeira Submenu */}
        <div className="pt-1">
          {(() => {
            const isFinanceActive = location.pathname.includes('/pagamentos') || location.pathname.includes('/caixa');
            return (
              <button 
                onClick={() => setIsFinanceOpen(!isFinanceOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isFinanceActive ? 'bg-primary/80 text-white hover:bg-primary/90' : 'hover:bg-primary/20 hover:text-primary text-gray-300'}`}
              >
            <div className="flex items-center gap-3">
              <PieChart size={20} />
              <span className="font-medium">Gestão Financeira</span>
            </div>
              {isFinanceOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )
          })()}
          
          {isFinanceOpen && (
            <div className="mt-1 flex flex-col gap-1">
              <Link
                to="/pagamentos"
                className="flex items-center gap-3 pl-11 pr-4 py-3 rounded-xl transition-all hover:bg-primary/20 hover:text-primary text-gray-400"
                activeProps={{ className: 'bg-primary text-white hover:bg-primary hover:text-white' }}
              >
                <DollarSign size={18} />
                <span className="font-medium text-sm">Recebimentos</span>
              </Link>
              <Link
                to="/caixa"
                className="flex items-center gap-3 pl-11 pr-4 py-3 rounded-xl transition-all hover:bg-primary/20 hover:text-primary text-gray-400"
                activeProps={{ className: 'bg-primary text-white hover:bg-primary hover:text-white' }}
              >
                <Wallet size={18} />
                <span className="font-medium text-sm">Fluxo de Caixa</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link to="/configuracoes" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-gray-800 text-gray-300">
          <Settings size={20} />
          <span className="font-medium">Configurações</span>
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-danger/20 hover:text-danger text-gray-300">
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  )
}
