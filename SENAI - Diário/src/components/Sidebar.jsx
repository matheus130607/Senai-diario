import { useContext } from 'react';
import { LayoutDashboard, ChevronLeft, ChevronRight, PieChart, BookOpen, Users, Building, GraduationCap, Settings, ListChecks } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';

export default function Sidebar({ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, currentActiveTab, onTabClick }) {
  const { currentUser } = useContext(AuthContext);

  const currentRole = currentUser?.role;

  const currentRoleTabs = currentRole === 'admin'
    ? [
        { id: 'dashboard', label: 'Visão Geral', icon: PieChart },
        { id: 'turmas', label: 'Turmas', icon: BookOpen },
        { id: 'professores', label: 'Professores', icon: Users },
        { id: 'empresas', label: 'Empresas', icon: Building },
        { id: 'alunos', label: 'Alunos', icon: GraduationCap },
        { id: 'config', label: 'Integrações', icon: Settings },
      ]
    : currentRole === 'professor'
      ? [
          { id: 'dashboard', label: 'Visão Geral', icon: PieChart },
          { id: 'chamada', label: 'Lista de Chamada', icon: ListChecks },
        ]
      : [
          { id: 'dashboard', label: 'Visão Geral', icon: PieChart },
          { id: 'alunos', label: 'Meus Aprendizes', icon: Users },
        ];

  return (
    <aside className={`fixed top-16 bottom-0 left-0 bg-white border-r border-slate-200 z-30 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-red-600" />
          {!sidebarCollapsed && <div>
            <div className="text-sm font-semibold">Navegação</div>
            <div className="text-xs text-slate-500">{currentUser?.role === 'admin' ? 'Administração' : currentUser?.role === 'professor' ? 'Professor' : 'Parceiro'}</div>
          </div>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 rounded-md hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setSidebarCollapsed(prev => !prev)} className="hidden lg:inline-flex p-2 rounded-md hover:bg-slate-100" aria-label="Recolher/expandir sidebar">{sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}</button>
        </div>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto">
        {currentRoleTabs.map(tab => {
          const isActive = tab.id === currentActiveTab;
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => { onTabClick(tab.id); }} className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${isActive ? 'bg-red-50 text-red-600' : 'text-slate-600'}`}>
              <Icon className="w-4 h-4" />
              {!sidebarCollapsed && <span className="truncate">{tab.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
