import { createRootRoute, Outlet } from '@tanstack/react-router'
import React from 'react'
import { Sidebar } from '../components/Sidebar'
import { Header } from '../components/Header'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="min-h-screen bg-secondary text-coxia-text font-sans flex">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64 min-h-screen">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
