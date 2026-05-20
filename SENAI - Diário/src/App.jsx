import { useState, useEffect, useContext } from 'react';
import { Loader2, LogOut, Shield, User, Building, CheckCircle2, Menu } from 'lucide-react';
import { DataContext } from './contexts/DataContext';
import { AuthContext } from './contexts/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ProfessorDashboard from './components/ProfessorDashboard';
import EmpresaDashboard from './components/EmpresaDashboard';
import Sidebar from './components/Sidebar';

export default function App() {
  const {
    data,
    setData,
    isDataLoading,
    syncStatus,
    syncError,
    isSupabaseConfigured,
    saveDataNow,
    reloadData,
  } = useContext(DataContext);
  const { currentUser, setCurrentUser } = useContext(AuthContext);
  const [globalLoading, setGlobalLoading] = useState(true);
  


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

  // Utilitários
  const [toast, setToast] = useState('');
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const rawDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const dataFormatada = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  useEffect(() => {
    const timer = setTimeout(() => setGlobalLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const requestConfirm = (title, message, onConfirm) => {
    setConfirmModal({ isOpen: true, title, message, onConfirm });
  };

  const logout = () => {
    requestConfirm("Sair da Conta", "Deseja realmente sair da conta?", () => {
      setCurrentUser(null);
      setLoginStep('select');
    });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const currentRole = currentUser?.role;

  const currentActiveTab = currentRole === 'admin' ? adminTab : currentRole === 'professor' ? profTab : empresaTab;

  const handleSidebarTabClick = (tabId) => {
    if (currentRole === 'admin') setAdminTab(tabId);
    if (currentRole === 'professor') setProfTab(tabId);
    if (currentRole === 'empresa') setEmpresaTab(tabId);
    setSidebarOpen(false);
  };

  // --- TELA DE CARREGAMENTO ---
  if (globalLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/SENAI_S%C3%A3o_Paulo_logo.png" alt="SENAI" className="h-16 mb-8 object-contain" />
          <div className="flex items-center gap-3 text-red-600 font-semibold tracking-widest uppercase text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> A Carregar o Sistema
          </div>
          <div className="mt-4 w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-red-600 w-1/2 animate-[bounce_1.5s_infinite]"></div>
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
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-800">
      {/* Modal Confirm */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null })} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
              <button onClick={() => { if(confirmModal.onConfirm) confirmModal.onConfirm(); setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null }); }} className="px-4 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}

      {/* Navbar Superior */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-md hover:bg-slate-100">
                <Menu className="w-5 h-5" />
              </button>
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/SENAI_S%C3%A3o_Paulo_logo.png" alt="SENAI" className="h-8 object-contain" />
              <div className="hidden md:flex h-6 w-px bg-slate-200"></div>
              <span className="hidden md:block text-slate-500 font-medium tracking-wide text-sm">{currentUser?.role === 'admin' ? 'Administrador' : currentUser?.role === 'professor' ? 'Professor' : 'Empresa'}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-slate-50">
                {currentUser.role === 'admin' && <Shield className="w-3.5 h-3.5 text-slate-600" />}
                {currentUser.role === 'professor' && <User className="w-3.5 h-3.5 text-blue-600" />}
                {currentUser.role === 'empresa' && <Building className="w-3.5 h-3.5 text-amber-600" />}
                <span className="text-slate-600 hidden sm:inline">
                  {currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'professor' ? `Prof. ${currentUser.nome.split(' ')[0]}` : `Parceiro: ${currentUser.nome}`}
                </span>
              </div>
              <button onClick={logout} className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg font-medium text-sm" title="Sair da Conta">
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
        currentActiveTab={currentActiveTab}
        onTabClick={handleSidebarTabClick}
      />

      <div className={`fixed top-16 left-0 right-0 bottom-0 bg-black/40 z-20 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`} onClick={() => setSidebarOpen(false)} />

      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {currentUser.role === 'admin' && (
          <AdminDashboard 
            data={data} 
            setData={setData} 
            currentUser={currentUser}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            showToast={showToast}
            requestConfirm={requestConfirm}
            syncStatus={syncStatus}
            syncError={syncError}
            isSupabaseConfigured={isSupabaseConfigured}
            saveDataNow={saveDataNow}
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
            saveDataNow={saveDataNow}
            isSupabaseConfigured={isSupabaseConfigured}
          />
        )}

        {currentUser.role === 'empresa' && (
          <EmpresaDashboard 
            data={data} 
            currentUser={currentUser}
            empresaTab={empresaTab}
            setEmpresaTab={setEmpresaTab}
            dataFormatada={dataFormatada}
          />
        )}
      </main>
    </div>
  );
}
