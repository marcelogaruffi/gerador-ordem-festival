import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-coxia-light rounded-2xl shadow-xl p-8 text-center border-t-4 border-primary">
        <h1 className="text-4xl font-serif text-primary mb-2">COXIA</h1>
        <p className="text-coxia-text mb-8 italic">A inteligência por trás da ordem das apresentações.</p>
        
        <div className="animate-pulse flex space-x-4 justify-center items-center">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <div className="w-3 h-3 bg-primary rounded-full"></div>
        </div>
        
        <p className="mt-8 text-sm text-gray-500">Construindo a interface principal...</p>
      </div>
    </div>
  )
}

export default App
