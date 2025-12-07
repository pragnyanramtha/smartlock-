import React from 'react';
import { LayoutDashboard, ScanFace, UserPlus } from 'lucide-react';
import { View } from '../types';

interface LayoutProps {
  currentView: View;
  onNavigate: (view: View) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onNavigate, children }) => {
  return (
    <div className="flex h-full bg-slate-900 text-white">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 flex-shrink-0 bg-slate-950 border-r border-slate-800 flex flex-col items-center lg:items-stretch py-6">
        <div className="flex items-center justify-center lg:justify-start lg:px-6 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ScanFace className="text-white w-6 h-6" />
          </div>
          <span className="hidden lg:block ml-3 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
            SmartLook
          </span>
        </div>

        <nav className="flex-1 space-y-2 px-2 lg:px-4">
          <NavItem 
            icon={<ScanFace />} 
            label="Attendance" 
            isActive={currentView === View.ATTENDANCE} 
            onClick={() => onNavigate(View.ATTENDANCE)} 
          />
          <NavItem 
            icon={<UserPlus />} 
            label="Registration" 
            isActive={currentView === View.REGISTER} 
            onClick={() => onNavigate(View.REGISTER)} 
          />
           <NavItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            isActive={currentView === View.DASHBOARD} 
            onClick={() => onNavigate(View.DASHBOARD)} 
          />
        </nav>

        <div className="p-4 text-xs text-slate-500 text-center lg:text-left hidden lg:block">
          v1.0.0 &copy; 2024
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-900 relative">
        {children}
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center lg:justify-start p-3 rounded-xl transition-all duration-200 group
        ${isActive 
          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
    >
      <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
        {icon}
      </div>
      <span className="hidden lg:block ml-3 font-medium">{label}</span>
    </button>
  );
};