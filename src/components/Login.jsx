import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Building, Shield, ChevronRight, ChevronLeft, ChevronDown, KeyRound, AlertCircle, Loader2, Wrench, ClipboardList
} from 'lucide-react';
import TechBackground from './TechBackground';
import { getRoleLabel } from '../utils/permissions';
import { showTestCredentialPanel } from '../utils/runtimeFlags';
import { isSupabaseConfigured, supabase } from '../services/supabaseClient';
import { authenticateSupabaseUser } from '../services/supabaseDataService';

const FALLBACK_TEST_CREDENTIALS = [
  {
    id: 'fallback-coordenacao',
    role: 'coordenacao',
    step: 'admin_auth',
    title: 'Administrador Geral',
    subtitle: 'Coordenacao',
    email: 'admin@senaisp.edu.br',
    secret: 'senha_teste_123',
    secretLabel: 'Senha',
  },
  {
    id: 'fallback-secretaria',
    role: 'secretaria',
    step: 'secretaria_auth',
    title: 'Secretaria Academica',
    subtitle: 'Secretaria',
    email: 'secretaria@senaisp.edu.br',
    secret: 'senha_teste_123',
    secretLabel: 'Senha',
  },
  {
    id: 'fallback-professor',
    role: 'professor',
    step: 'prof_auth',
    title: 'Carlos Eduardo Almeida',
    subtitle: 'Professor',
    email: 'carlos.almeida@senaisp.edu.br',
    secret: 'senha_teste_123',
    secretLabel: 'Senha',
  },
  {
    id: 'fallback-empresa',
    role: 'empresa',
    step: 'empresa_auth',
    title: 'Tech Solutions Brasil',
    subtitle: 'Empresa',
    email: 'contato@techsolutions.com.br',
    secret: 'senha_teste_123',
    secretLabel: 'Senha',
  },
];

const FALLBACK_TIC_CREDENTIAL = {
  id: 'fallback-tic',
  role: 'tic',
  step: 'tic_auth',
  title: 'TIC Super Admin',
  subtitle: 'TIC',
  email: 'tic@senaisp.edu.br',
  secret: 'senha_teste_123',
  secretLabel: 'Senha',
};

export default function Login({
  currentUser, setCurrentUser, setGlobalLoading, data,
  loginStep, setLoginStep, adminPassword, setAdminPassword,
  profEmail, setProfEmail, profSenha, setProfSenha, loginError, setLoginError
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticPassword, setTicPassword] = useState('');
  const [isCredentialPanelOpen, setIsCredentialPanelOpen] = useState(false);
  const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
  const normalizePassword = (value) => String(value || '').trim();
  const isTicRoute = window.location.pathname.replace(/\/$/, '') === '/sesisenaisp72';

  const supabaseCredentials = useMemo(() => {
    const source = data || {};
    const withPassword = (items, mapper) => (items || [])
      .map(mapper)
      .filter((item) => item.email && item.secret);

    const remoteCredentials = isSupabaseConfigured ? [
      ...withPassword(source.professores, (professor) => ({
        id: `professor-${professor.id || professor.email}`,
        role: 'professor',
        step: 'prof_auth',
        title: professor.nome || 'Professor',
        subtitle: 'Professor',
        email: professor.email,
        secret: professor.senha,
        secretLabel: 'Senha',
      })),
      ...withPassword(source.empresas, (empresa) => ({
        id: `empresa-${empresa.id || empresa.email}`,
        role: 'empresa',
        step: 'empresa_auth',
        title: empresa.nome || 'Empresa parceira',
        subtitle: 'Empresa',
        email: empresa.email,
        secret: empresa.senha,
        secretLabel: 'Senha',
      })),
      ...withPassword(source.administradores, (admin) => {
        const role = String(admin.perfil || admin.role || '').toLowerCase();
        const isSecretaria = role === 'secretaria';
        return {
          id: `${isSecretaria ? 'secretaria' : 'coordenacao'}-${admin.id || admin.email}`,
          role: isSecretaria ? 'secretaria' : 'coordenacao',
          step: isSecretaria ? 'secretaria_auth' : 'admin_auth',
          title: admin.nome || (isSecretaria ? 'Secretaria' : 'Coordenação'),
          subtitle: isSecretaria ? 'Secretaria' : 'Coordenação',
          email: admin.email,
          secret: admin.senha,
          secretLabel: 'Senha',
        };
      }),
    ] : [];

    const fallbackCredentials = isSupabaseConfigured && showTestCredentialPanel ? [...FALLBACK_TEST_CREDENTIALS] : [];
    if (isTicRoute) {
      fallbackCredentials.push(FALLBACK_TIC_CREDENTIAL);
    }

    return showTestCredentialPanel && remoteCredentials.length > 0 ? remoteCredentials : fallbackCredentials;
  }, [data, isTicRoute]);
  const shouldShowCredentialPanel = showTestCredentialPanel && supabaseCredentials.length > 0;

  const appendTicLog = (event, email) => {
    try {
      const logs = JSON.parse(localStorage.getItem('senai-diario:tic-access-logs') || '[]');
      localStorage.setItem('senai-diario:tic-access-logs', JSON.stringify([
        {
          id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          event,
          email,
          at: new Date().toISOString(),
          path: window.location.pathname,
        },
        ...logs,
      ].slice(0, 25)));
    } catch {
      localStorage.setItem('senai-diario:tic-access-logs', '[]');
    }

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('tic_access_logs')
        .insert({
          email: email || null,
          event,
          metadata: {
            path: window.location.pathname,
            userAgent: navigator.userAgent,
          },
        })
        .then(({ error }) => {
          if (!error) return;
          const message = String(error.message || '').toLowerCase();
          const isMissingTable = message.includes('tic_access_logs')
            || message.includes('schema cache')
            || message.includes('does not exist')
            || message.includes('could not find the table');
          if (!isMissingTable) console.error('Erro ao registrar log TIC no Supabase:', error);
        });
    }
  };

  const prepareLoginStep = (step) => {
    setLoginStep(step);
    setLoginError('');
    setProfEmail('');
    setProfSenha('');
    setAdminPassword('');
    setTicPassword('');
  };

  const fillDemoCredential = (credential) => {
    setLoginStep(credential.step);
    setLoginError('');
    setProfEmail(credential.email);

    if (credential.step === 'admin_auth' || credential.step === 'secretaria_auth') {
      setAdminPassword(credential.secret);
      setProfSenha('');
      setTicPassword('');
      return;
    }

    if (credential.step === 'tic_auth') {
      setTicPassword(credential.secret);
      setAdminPassword('');
      setProfSenha('');
      return;
    }

    setProfSenha(credential.secret);
    setAdminPassword('');
    setTicPassword('');
  };

  const handleDatabaseLogin = async ({ role, email, password }) => {
    try {
      setIsSubmitting(true);
      setGlobalLoading(true);

      if (!isSupabaseConfigured) {
        throw new Error('Supabase não configurado. Crie um .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      }

      const user = await authenticateSupabaseUser({ role, email, password });
      setCurrentUser(user);
      setLoginError('');
      setProfEmail('');
      setProfSenha('');
      setAdminPassword('');
      setTicPassword('');
      return user;
    } catch (error) {
      setLoginError(error.message || 'Não foi possível autenticar no Supabase.');
      return null;
    } finally {
      setGlobalLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    await handleDatabaseLogin({
      role: 'coordenacao',
      email: normalizeEmail(profEmail),
      password: normalizePassword(adminPassword),
    });
  };

  const handleSecretariaLogin = async (e) => {
    e.preventDefault();
    await handleDatabaseLogin({
      role: 'secretaria',
      email: normalizeEmail(profEmail),
      password: normalizePassword(adminPassword),
    });
  };

  const handleTicLogin = async (e) => {
    e.preventDefault();
    const email = normalizeEmail(profEmail);
    const password = normalizePassword(ticPassword);

    if (!isTicRoute) {
      setLoginError('A rota técnica não está habilitada.');
      appendTicLog('tic_route_blocked', email);
      return;
    }

    appendTicLog('tic_login_attempt', email);
    const user = await handleDatabaseLogin({
      role: 'tic',
      email,
      password,
    });

    appendTicLog(user ? 'tic_login_success' : 'tic_login_denied', email);
  };

  const handleProfLogin = async (e) => {
    e.preventDefault();
    await handleDatabaseLogin({
      role: 'professor',
      email: normalizeEmail(profEmail),
      password: normalizePassword(profSenha),
    });
  };

  const handleEmpresaLogin = async (e) => {
    e.preventDefault();
    await handleDatabaseLogin({
      role: 'empresa',
      email: normalizeEmail(profEmail),
      password: normalizePassword(profSenha),
    });
  };

  if (currentUser) return null;

  // Variantes de animação (já rápidas)
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const slideUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const slideRight = {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-black overflow-hidden">
      {/* LADO ESQUERDO - FUNDO TECNOLÓGICO + CONTEÚDO */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-black overflow-hidden">
        <TechBackground />
        
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="absolute inset-0 z-10 flex flex-col items-center text-white pointer-events-none"
        >
          {/* Logo centralizada e alinhada ao topo do card direito */}
          <div className="pt-36">
            <img
              src={"https://upload.wikimedia.org/wikipedia/commons/8/8c/SENAI_S%C3%A3o_Paulo_logo.png"}
              alt="SENAI SP"
              className="h-16 w-auto object-contain mx-auto"
            />
          </div>

          {/* Texto centralizado */}
          <div className="mt-auto pb-6 px-12 xl:px-16 text-center">
            <div className="w-12 h-0.5 bg-red-600 mb-6 mx-auto"></div>
            <h1 className="text-3xl xl:text-4xl font-bold mb-4 leading-tight tracking-tight">
              Educação para a <br />Indústria do Futuro
            </h1>
            <p className="text-base text-slate-300 font-light max-w-md mx-auto leading-relaxed">
              Diário Digital SENAI para registrar presenças, acompanhar aprendizes e conectar escola, professores e empresas parceiras.
            </p>
          </div>
        </motion.div>
      </div>

      {/* LADO DIREITO - FUNDO BRANCO E CARD BRANCO */}
      <div className="w-full lg:w-1/2 relative bg-white flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white lg:hidden" />

        <div className="relative z-20 w-full max-w-md">
          <AnimatePresence mode="wait">
            {loginStep === 'select' && (
              <motion.div
                key="select"
                variants={slideUp}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
              >
                <h2 className="text-2xl font-semibold text-center text-gray-900 mb-2">
                  Acessar Plataforma
                </h2>
                <p className="text-sm text-center text-gray-500 mb-8">
                  Selecione o seu perfil
                </p>

                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="space-y-3"
                >
                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      prepareLoginStep('prof_auth');
                    }}
                    className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:bg-red-50 hover:border-red-200 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Sou Professor</h3>
                        <p className="text-xs text-gray-500">Registrar presenças e acompanhar turmas</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      prepareLoginStep('empresa_auth');
                    }}
                    className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:bg-red-50 hover:border-red-200 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Building className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Sou Empresa Parceira</h3>
                        <p className="text-xs text-gray-500">Acompanhar aprendizes vinculados</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      prepareLoginStep('admin_auth');
                    }}
                    className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:bg-red-50 hover:border-red-200 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Coordenação</h3>
                        <p className="text-xs text-gray-500">Indicadores, alertas e visão estratégica</p>
                      </div>
                    </div>
                    <KeyRound size={20} className="text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      prepareLoginStep('secretaria_auth');
                    }}
                    className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:bg-red-50 hover:border-red-200 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Secretaria</h3>
                        <p className="text-xs text-gray-500">Cadastros, vínculos e rotinas administrativas</p>
                      </div>
                    </div>
                    <KeyRound size={20} className="text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  {isTicRoute && (
                    <motion.button
                      variants={itemVariants}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setLoginStep('tic_auth');
                        setLoginError('');
                        setProfEmail('');
                        setTicPassword('');
                        setAdminPassword('');
                        setProfSenha('');
                      }}
                      className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white hover:bg-red-700 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-white/10 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Wrench className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold">Login TIC</h3>
                          <p className="text-xs text-white/70">Área técnica validada pelo Supabase</p>
                        </div>
                      </div>
                      <KeyRound size={20} className="text-white/70 group-hover:translate-x-1 transition-all" />
                    </motion.button>
                  )}
                </motion.div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                  <span>© {new Date().getFullYear()} Somativa</span>
                  <a href="#" className="hover:text-red-500 transition-colors">Precisa de ajuda?</a>
                </div>
              </motion.div>
            )}

            {loginStep !== 'select' && (
              <motion.div
                key="auth"
                variants={slideRight}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, x: -30 }}
                className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100"
              >
                <button
                  onClick={() => { setLoginStep('select'); setLoginError(''); }}
                  className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 mb-6 transition-colors"
                >
                  <ChevronLeft size={16} /> Voltar aos perfis
                </button>

                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                    {loginStep === 'admin_auth' ? 'Acesso da Coordenação' : loginStep === 'secretaria_auth' ? 'Acesso da Secretaria' : loginStep === 'tic_auth' ? 'Login TIC' : 'Acessar Conta'}
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    {loginStep === 'admin_auth' && 'Entre com uma conta de Coordenação.'}
                    {loginStep === 'secretaria_auth' && 'Entre com uma conta da Secretaria acadêmica.'}
                    {loginStep === 'tic_auth' && `Entre com a conta ${getRoleLabel('tic')} cadastrada no Supabase.`}
                    {loginStep === 'prof_auth' && 'Bem-vindo de volta, Professor!'}
                    {loginStep === 'empresa_auth' && 'Área exclusiva para empresas parceiras.'}
                  </p>
                </div>

                <form
                  onSubmit={
                    loginStep === 'admin_auth' ? handleAdminLogin :
                    loginStep === 'secretaria_auth' ? handleSecretariaLogin :
                    loginStep === 'tic_auth' ? handleTicLogin :
                    loginStep === 'prof_auth' ? handleProfLogin :
                    handleEmpresaLogin
                  }
                >
                  <div className="mb-4">
                    <label htmlFor="login-email" className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                      E-mail Corporativo
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      value={profEmail}
                      onChange={(e) => setProfEmail(e.target.value)}
                      placeholder="exemplo@somativa.br"
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="mb-6">
                    <label htmlFor="login-password" className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                      {loginStep === 'admin_auth' || loginStep === 'secretaria_auth' ? 'Senha administrativa' : loginStep === 'tic_auth' ? 'Senha TIC' : 'Senha'}
                    </label>
                    <div className="relative">
                      {(loginStep === 'admin_auth' || loginStep === 'secretaria_auth' || loginStep === 'tic_auth') && (
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      )}
                      <input
                        id="login-password"
                        type="password"
                        value={loginStep === 'admin_auth' || loginStep === 'secretaria_auth' ? adminPassword : loginStep === 'tic_auth' ? ticPassword : profSenha}
                        onChange={(e) => loginStep === 'admin_auth' || loginStep === 'secretaria_auth' ? setAdminPassword(e.target.value) : loginStep === 'tic_auth' ? setTicPassword(e.target.value) : setProfSenha(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition ${
                          (loginStep === 'admin_auth' || loginStep === 'secretaria_auth' || loginStep === 'tic_auth') ? 'pl-10' : ''
                        }`}
                        required
                      />
                    </div>
                    {loginError && (
                      <p className="text-red-500 text-xs flex items-center gap-1 mt-2">
                        <AlertCircle size={14} /> {loginError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-full transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Processando...
                      </span>
                    ) : (
                      'Entrar na Plataforma'
                    )}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                  <span>© {new Date().getFullYear()} Somativa</span>
                  <a href="#" className="hover:text-red-500 transition-colors">Precisa de ajuda?</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {shouldShowCredentialPanel && (
      <div className="fixed bottom-4 right-4 z-40 w-[calc(100vw-2rem)] max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        >
          <button
            type="button"
            onClick={() => setIsCredentialPanelOpen((isOpen) => !isOpen)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
            aria-expanded={isCredentialPanelOpen}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <ClipboardList size={18} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-950">Acessos do Supabase</span>
                <span className="block text-xs text-slate-500">
                  {supabaseCredentials.length} {supabaseCredentials.length === 1 ? 'perfil disponível' : 'perfis disponíveis'}
                </span>
              </span>
            </span>
            <ChevronDown
              size={18}
              className={`text-slate-500 transition-transform ${isCredentialPanelOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {isCredentialPanelOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-slate-100"
              >
                <div className="max-h-80 overflow-y-auto p-2">
                  {supabaseCredentials.length === 0 ? (
                    <div className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                      {isSupabaseConfigured
                        ? 'Nenhum acesso com senha foi retornado pelo Supabase.'
                        : 'Supabase não configurado neste ambiente. Configure o .env para listar os acessos reais.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {supabaseCredentials.map((credential) => (
                        <button
                          key={credential.id}
                          type="button"
                          onClick={() => fillDemoCredential(credential)}
                          className="w-full rounded-xl border border-slate-100 bg-white px-3 py-3 text-left transition hover:border-red-200 hover:bg-red-50"
                        >
                          <span className="mb-2 flex items-center justify-between gap-3">
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-950">{credential.title}</span>
                              <span className="block text-xs font-medium text-red-600">{credential.subtitle}</span>
                            </span>
                            <ChevronRight size={16} className="shrink-0 text-slate-400" />
                          </span>
                          <span className="block truncate text-xs text-slate-600">Login: {credential.email}</span>
                          <span className="block truncate text-xs text-slate-600">{credential.secretLabel}: {credential.secret}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      )}
    </div>
  );
}
