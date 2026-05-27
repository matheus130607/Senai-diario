import { useState, useEffect, useContext, useRef } from 'react';
import {
  Accessibility,
  Building,
  CheckCircle2,
  Loader2,
  LogOut,
  PanelLeft,
  Settings,
  Shield,
  User,
  UserRound,
} from 'lucide-react';
import { DataContext } from './contexts/DataContext';
import { AuthContext } from './contexts/AuthContext';
import { supabase } from './services/supabaseClient';
import { getTodayAttendanceDate } from './services/supabaseDataService';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ProfessorDashboard from './components/ProfessorDashboard';
import EmpresaDashboard from './components/EmpresaDashboard';
import Sidebar from './components/Sidebar';
import { getRoleLabel, isAdministrativeRole } from './utils/permissions';

export default function App() {
  const {
    data,
    setData,
    isDataLoading,
    syncStatus,
    syncError,
    isSupabaseConfigured,
    reloadData,
    saveAttendance,
  } = useContext(DataContext);
  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const [globalLoading, setGlobalLoading] = useState(true);
  const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(getTodayAttendanceDate());
  


  // Login States
  const [loginStep, setLoginStep] = useState('select');
  const [adminPassword, setAdminPassword] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profSenha, setProfSenha] = useState('');
  const [loginError, setLoginError] = useState('');

  // Dashboard States
  const [adminTab, setAdminTab] = useState('dashboard');
  const [profTab, setProfTab] = useState('dashboard');
  const [empresaTab, setEmpresaTab] = useState('dashboard');
  const [profActiveTurma, setProfActiveTurma] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);

  // Utilitários
  const [toast, setToast] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const rawDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const dataFormatada = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  useEffect(() => {
    const timer = setTimeout(() => setGlobalLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const isTicRoute = window.location.pathname.replace(/\/$/, '') === '/sesisenaisp72';
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', isTicRoute ? 'noindex,nofollow,noarchive' : 'index,follow');
  }, []);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [accountMenuOpen]);

  const requestConfirm = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const logout = () => {
    requestConfirm("Sair da Conta", "Deseja realmente sair da conta?", async () => {
      await supabase?.auth?.signOut?.();
      setCurrentUser(null);
      setLoginStep('select');
    });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const currentRole = currentUser?.role;
  const effectiveAdminTab = currentRole !== 'tic' && adminTab === 'config' ? 'dashboard' : adminTab;

  const currentActiveTab = isAdministrativeRole(currentRole) ? effectiveAdminTab : currentRole === 'professor' ? profTab : empresaTab;

  const handleSidebarTabClick = (tabId) => {
    if (isAdministrativeRole(currentRole)) setAdminTab(tabId);
    if (currentRole === 'professor') setProfTab(tabId);
    if (currentRole === 'empresa') setEmpresaTab(tabId);
    setAccountMenuOpen(false);
    setSidebarOpen(false);
  };

  const handleAccountMenuTabClick = (tabId) => {
    if (isAdministrativeRole(currentRole)) setAdminTab(tabId);
    if (currentRole === 'professor') setProfTab(tabId);
    if (currentRole === 'empresa') setEmpresaTab(tabId);
    setAccountMenuOpen(false);
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setSidebarCollapsed(prev => !prev);
      return;
    }

    setSidebarOpen(prev => !prev);
  };

  // --- TELA DE CARREGAMENTO ---
  if (globalLoading || isDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex animate-pulse flex-col items-center">
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/SENAI_S%C3%A3o_Paulo_logo.png" alt="SENAI" className="h-16 mb-8 object-contain" />
          <div className="flex items-center gap-3 text-sm font-bold uppercase text-red-600">
            <Loader2 className="h-5 w-5 animate-spin" /> Carregando o sistema
          </div>
          <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-1/2 animate-[bounce_1.5s_infinite] bg-red-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // --- TELA DE LOGIN ---
  if (!currentUser) {
    return <Login
      data={data}
      setCurrentUser={setCurrentUser} 
      setGlobalLoading={setGlobalLoading}
      loginStep={loginStep} 
      setLoginStep={setLoginStep} 
      adminPassword={adminPassword} 
      setAdminPassword={setAdminPassword}
      profEmail={profEmail} 
      setProfEmail={setProfEmail} 
      profSenha={profSenha} 
      setProfSenha={setProfSenha} 
      loginError={loginError} 
      setLoginError={setLoginError}
    />;
  }

  // --- TELA PRINCIPAL (DASHBOARD) ---
  return (
    <div className="app-shell min-h-screen font-sans text-slate-800">
      {/* Modal Confirm */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="ds-panel max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })} className="ds-button ds-button-neutral">Cancelar</button>
              <button onClick={() => { if(confirmModal.onConfirm) confirmModal.onConfirm(); setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null }); }} className="ds-button ds-button-primary">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-950 px-5 py-3 text-white shadow-lg animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Navbar Superior */}
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-[#fbfbfd]/86 backdrop-blur-xl">
        <div className="w-full px-0">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4 pl-4 sm:pl-6 lg:pl-8">
              <button onClick={toggleSidebar} className="rounded-md p-2 text-slate-500 hover:bg-white hover:text-slate-900" aria-label="Abrir ou esconder menu lateral">
                <PanelLeft className="w-5 h-5" />
              </button>
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/SENAI_S%C3%A3o_Paulo_logo.png" alt="SENAI" className="h-7 object-contain" />
              <div className="hidden md:flex h-6 w-px bg-slate-200"></div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-slate-900">Diário Digital SENAI</div>
              </div>
            </div>
            <div className="flex items-center gap-4 pr-4 sm:pr-6 lg:pr-8">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-medium">
                {isAdministrativeRole(currentUser.role) && <Shield className="w-3.5 h-3.5 text-slate-600" />}
                {currentUser.role === 'professor' && <User className="w-3.5 h-3.5 text-blue-600" />}
                {currentUser.role === 'empresa' && <Building className="w-3.5 h-3.5 text-amber-600" />}
                <span className="text-slate-600 hidden sm:inline">
                  {isAdministrativeRole(currentUser.role) ? getRoleLabel(currentUser.role) : currentUser.role === 'professor' ? `Prof. ${currentUser.nome.split(' ')[0]}` : `Parceiro: ${currentUser.nome}`}
                </span>
              </div>
              <div ref={accountMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen(prev => !prev)}
                  className="ds-button ds-button-neutral"
                  aria-label="Abrir ajustes da conta"
                  aria-expanded={accountMenuOpen}
                  title="Ajustes"
                >
                  <Settings className="w-4 h-4" />
                </button>
                {accountMenuOpen && (
                  <div className="account-menu absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
                    <button
                      type="button"
                      onClick={() => handleAccountMenuTabClick('perfil')}
                      className={`account-menu-item ${currentActiveTab === 'perfil' ? 'is-active' : ''}`}
                    >
                      <UserRound className="h-4 w-4" />
                      Perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccountMenuTabClick('acessibilidade')}
                      className={`account-menu-item ${currentActiveTab === 'acessibilidade' ? 'is-active' : ''}`}
                    >
                      <Accessibility className="h-4 w-4" />
                      Acessibilidade
                    </button>
                  </div>
                )}
              </div>
              <button onClick={logout} className="ds-button ds-button-neutral" title="Sair da Conta">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar + Backdrop (Mobile) */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        sidebarWidth={sidebarWidth}
        setSidebarWidth={setSidebarWidth}
        currentActiveTab={currentActiveTab}
        onTabClick={handleSidebarTabClick}
      />

      <div className={`fixed top-16 left-0 right-0 bottom-0 bg-black/40 z-20 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <main
        className="app-main mx-auto max-w-[1520px] px-4 py-8 transition-[padding] duration-200 sm:px-6 lg:px-8 lg:py-10"
        style={{ '--sidebar-offset': sidebarCollapsed ? '0px' : `${sidebarWidth}px` }}
      >
        {isAdministrativeRole(currentUser.role) && (
          <AdminDashboard 
            data={data} 
            setData={setData} 
            currentUser={currentUser}
            adminTab={effectiveAdminTab}
            setAdminTab={setAdminTab}
            showToast={showToast}
            requestConfirm={requestConfirm}
            syncStatus={syncStatus}
            syncError={syncError}
            isSupabaseConfigured={isSupabaseConfigured}
            reloadData={reloadData}
          />
        )}

        {currentUser.role === 'professor' && (
          <ProfessorDashboard 
            data={data} 
            setData={setData} 
            currentUser={currentUser}
            profTab={profTab}
            setProfTab={setProfTab}
            profActiveTurma={profActiveTurma}
            setProfActiveTurma={setProfActiveTurma}
            showToast={showToast}
            requestConfirm={requestConfirm}
            dataFormatada={dataFormatada}
            saveAttendance={saveAttendance}
            isSupabaseConfigured={isSupabaseConfigured}
            reloadData={reloadData}
            selectedAttendanceDate={selectedAttendanceDate}
            setSelectedAttendanceDate={setSelectedAttendanceDate}
          />
        )}

        {currentUser.role === 'empresa' && (
          <EmpresaDashboard 
            data={data} 
            currentUser={currentUser}
            empresaTab={empresaTab}
            setEmpresaTab={setEmpresaTab}
            showToast={showToast}
            dataFormatada={dataFormatada}
            isSupabaseConfigured={isSupabaseConfigured}
            reloadData={reloadData}
            selectedAttendanceDate={selectedAttendanceDate}
            setSelectedAttendanceDate={setSelectedAttendanceDate}
          />
        )}
      </main>
    </div>
  );
}
