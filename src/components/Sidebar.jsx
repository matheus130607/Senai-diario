import { useContext } from 'react';
import {
  BookOpen,
  BarChart3,
  Building,
  CalendarDays,
  GraduationCap,
  ListChecks,
  Mail,
  PieChart,
  ShieldCheck,
  Settings,
  Users,
  Wrench,
} from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { isAdministrativeRole } from '../utils/permissions';

export default function Sidebar({
  sidebarOpen,
  sidebarCollapsed,
  sidebarWidth,
  setSidebarWidth,
  currentActiveTab,
  onTabClick,
}) {
  const { currentUser } = useContext(AuthContext);
  const currentRole = currentUser?.role;

  const coordenacaoTabs = [
    { id: 'dashboard', label: 'Visão geral', icon: PieChart },
    { id: 'indicadores', label: 'Indicadores', icon: BarChart3 },
    { id: 'alertas', label: 'Alertas de frequência', icon: ShieldCheck },
    { id: 'relatorios', label: 'Relatórios', icon: ListChecks },
    { id: 'calendario', label: 'Calendário', icon: CalendarDays },
    { id: 'automacoes', label: 'Comunicados automáticos', icon: Mail },
  ];

  const secretariaTabs = [
    { id: 'dashboard', label: 'Visão operacional', icon: PieChart },
    { id: 'alunos', label: 'Alunos', icon: GraduationCap },
    { id: 'professores', label: 'Professores', icon: Users },
    { id: 'empresas', label: 'Empresas', icon: Building },
    { id: 'turmas', label: 'Turmas', icon: BookOpen },
    { id: 'vinculos', label: 'Vínculos', icon: ShieldCheck },
    { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
    { id: 'calendario', label: 'Calendário', icon: CalendarDays },
    { id: 'automacoes', label: 'Comunicados automáticos', icon: Mail },
  ];

  const ticTabs = [
    { id: 'dashboard', label: 'Saúde do sistema', icon: PieChart },
    { id: 'config', label: 'Integrações', icon: Settings },
    { id: 'tic', label: 'TIC e auditoria', icon: Wrench },
    ...secretariaTabs.filter((tab) => tab.id !== 'dashboard'),
  ];

  const currentRoleTabs = isAdministrativeRole(currentRole)
    ? [
        ...(currentRole === 'secretaria' ? secretariaTabs : currentRole === 'tic' ? ticTabs : coordenacaoTabs),
      ]
    : currentRole === 'professor'
      ? [
          { id: 'dashboard', label: 'Visão geral', icon: PieChart },
          { id: 'chamada', label: 'Registro de presença', icon: ListChecks },
          { id: 'turmas', label: 'Minhas turmas', icon: BookOpen },
          { id: 'aprendizes', label: 'Aprendizes', icon: GraduationCap },
          { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
          { id: 'calendario', label: 'Calendário', icon: CalendarDays },
        ]
      : [
          { id: 'dashboard', label: 'Visão geral', icon: PieChart },
          { id: 'alunos', label: 'Aprendizes vinculados', icon: Users },
          { id: 'historico', label: 'Histórico', icon: ShieldCheck },
          { id: 'calendario', label: 'Calendário', icon: CalendarDays },
        ];

  const startResize = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const onMove = (moveEvent) => {
      const nextWidth = Math.min(360, Math.max(232, startWidth + moveEvent.clientX - startX));
      setSidebarWidth(nextWidth);
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <aside
      className={`fixed bottom-0 left-0 top-16 z-30 transform border-r border-slate-200 bg-[#fbfbfd]/92 backdrop-blur-xl transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} ${sidebarCollapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'}`}
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="flex h-full flex-col">
        <nav className="flex-1 space-y-1 px-3 py-5">
          {currentRoleTabs.map((tab) => {
            const isActive = tab.id === currentActiveTab;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => onTabClick(tab.id)}
                className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive ? 'bg-white text-slate-950 ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/70 hover:text-slate-900'}`}
              >
                {isActive && <span className="absolute left-0 h-5 w-0.5 rounded-r-full bg-red-600" />}
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-red-600' : 'text-slate-400 group-hover:text-slate-700'}`} />
                <span className="truncate font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mx-4 mb-5 border-t border-slate-200 pt-4">
          <blockquote className="text-sm font-medium leading-6 text-slate-900">
            "Educação profissional que transforma o futuro da indústria."
          </blockquote>
        </div>
      </div>

      {!sidebarCollapsed && (
        <button
          type="button"
          onPointerDown={startResize}
          className="absolute right-[-5px] top-0 hidden h-full w-2 cursor-col-resize touch-none bg-transparent transition-colors hover:bg-red-500/20 lg:block"
          aria-label="Redimensionar menu lateral"
        />
      )}
    </aside>
  );
}
