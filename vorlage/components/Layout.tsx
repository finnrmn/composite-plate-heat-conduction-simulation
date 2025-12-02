import React, { ReactNode } from 'react';
import { Activity, Settings, Github } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: 'sim' | 'edit';
  onTabChange: (tab: 'sim' | 'edit') => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <header className="flex-none h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center px-6 justify-between z-10">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-teal-400">
              2D HEAT CONDUCTION SIMULATION
            </h1>
            <p className="text-[10px] text-slate-400 tracking-wider font-medium">FTCS HEAT SOLVER</p>
          </div>
        </div>

        <nav className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => onTabChange('edit')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'edit' 
                ? 'bg-slate-700 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center"><Settings className="w-3.5 h-3.5 mr-2"/> Setup</span>
          </button>
          <button
            onClick={() => onTabChange('sim')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'sim' 
                ? 'bg-teal-600 text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center"><Activity className="w-3.5 h-3.5 mr-2"/> Simulation</span>
          </button>
        </nav>
        
        
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};
