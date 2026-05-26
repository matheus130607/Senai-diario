import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Building, Shield, ChevronRight, ChevronLeft, KeyRound, AlertCircle, Loader2, Wrench
} from 'lucide-react';
import TechBackground from './TechBackground';
import { getRoleLabel } from '../utils/permissions';

export default function Login({
  currentUser, setCurrentUser, setGlobalLoading, data,
  loginStep, setLoginStep, adminPassword, setAdminPassword,
  profEmail, setProfEmail, profSenha, setProfSenha, loginError, setLoginError
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticToken, setTicToken] = useState('');
  const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
  const normalizePassword = (value) => String(value || '').trim();
  const firstCredential = (users = []) => users.find((user) => user?.email && user?.senha) || {};
  const isTicRoute = window.location.pathname.replace(/\/$/, '') === '/sesisenaisp72';
  const ticAccessToken = import.meta.env.VITE_TIC_ACCESS_TOKEN || 'SENAI-TIC-72';

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
  };

  const fillTestCredentials = (role) => {
    setLoginError('');

    if (role === 'professor') {
      const professor = firstCredential(data.professores);
      setProfEmail(professor.email || '');
      setProfSenha(professor.senha || '');
      setAdminPassword('');
      return;
    }

    if (role === 'empresa') {
      const empresa = firstCredential(data.empresas);
      setProfEmail(empresa.email || '');
      setProfSenha(empresa.senha || '');
      setAdminPassword('');
      return;
    }

    const admin = firstCredential(data.administradores);
    setProfEmail(admin.email || '');
    setProfSenha('');
    setAdminPassword(admin.senha || '');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const email = normalizeEmail(profEmail);
    const password = normalizePassword(adminPassword);
    const admin = data.administradores?.find(admin => {
      const adminEmail = normalizeEmail(admin.email);
      return normalizePassword(admin.senha) === password && (!adminEmail || adminEmail === email);
    });
    if (admin) {
      setIsSubmitting(true);
      setGlobalLoading(true);
      setTimeout(() => {
        const role = admin.perfil || admin.role || 'coordenacao';
        setCurrentUser({
          role,
          id: admin.id,
          nome: admin.nome || 'Administrador',
          email: admin.email,
        });
        setLoginError('');
        setProfEmail('');
        setAdminPassword('');
        setGlobalLoading(false);
        setIsSubmitting(false);
      }, 800);
    } else {
      setLoginError('E-mail ou palavra-passe de administrador incorretos.');
    }
  };

  const handleTicLogin = async (e) => {
    e.preventDefault();
    const email = normalizeEmail(profEmail);
    const token = normalizePassword(ticToken);

    if (!isTicRoute) {
      setLoginError('A rota técnica não está habilitada.');
      appendTicLog('tic_route_blocked', email);
      return;
    }

    if (token !== ticAccessToken) {
      setLoginError('Token técnico inválido.');
      appendTicLog('tic_token_denied', email);
      return;
    }

    setIsSubmitting(true);
    setGlobalLoading(true);
    appendTicLog('tic_login_allowed', email);
    setTimeout(() => {
      setCurrentUser({
        role: 'tic',
        id: 'tic-super-admin',
        nome: 'TIC Super Admin',
        email: email || 'tic@senaisp.edu.br',
      });
      setLoginError('');
      setProfEmail('');
      setTicToken('');
      setGlobalLoading(false);
      setIsSubmitting(false);
    }, 800);
  };

  const handleProfLogin = async (e) => {
    e.preventDefault();
    const email = normalizeEmail(profEmail);
    const password = normalizePassword(profSenha);
    const prof = data.professores.find(p => normalizeEmail(p.email) === email && normalizePassword(p.senha) === password);
    if (prof) {
      setIsSubmitting(true);
      setGlobalLoading(true);
      setTimeout(() => {
        const professorSemSenha = { ...prof };
        delete professorSemSenha.senha;
        setCurrentUser({ role: 'professor', ...professorSemSenha });
        setLoginError('');
        setProfEmail('');
        setProfSenha('');
        setGlobalLoading(false);
        setIsSubmitting(false);
      }, 800);
    } else {
      setLoginError('E-mail ou palavra-passe incorretos.');
    }
  };

  const handleEmpresaLogin = async (e) => {
    e.preventDefault();
    const email = normalizeEmail(profEmail);
    const password = normalizePassword(profSenha);
    const emp = data.empresas.find(emp => normalizeEmail(emp.email) === email && normalizePassword(emp.senha) === password);
    if (emp) {
      setIsSubmitting(true);
      setGlobalLoading(true);
      setTimeout(() => {
        const empresaSemSenha = { ...emp };
        delete empresaSemSenha.senha;
        setCurrentUser({ role: 'empresa', ...empresaSemSenha });
        setLoginError('');
        setProfEmail('');
        setProfSenha('');
        setGlobalLoading(false);
        setIsSubmitting(false);
      }, 800);
    } else {
      setLoginError('E-mail ou palavra-passe incorretos.');
    }
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
              Portal de Gestão Escolar Somativa. Registre presenças, acompanhe desempenho e conecte alunos às empresas parceiras.
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
                  Aceder à Plataforma
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
                      setLoginStep('prof_auth');
                      fillTestCredentials('professor');
                    }}
                    className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:bg-red-50 hover:border-red-200 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Sou Professor</h3>
                        <p className="text-xs text-gray-500">Aceder ao diário de classe eletrónico</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setLoginStep('empresa_auth');
                      fillTestCredentials('empresa');
                    }}
                    className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:bg-red-50 hover:border-red-200 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Building className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Sou Empresa Parceira</h3>
                        <p className="text-xs text-gray-500">Acompanhar os alunos aprendizes</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" />
                  </motion.button>

                  <motion.button
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setLoginStep('admin_auth');
                      fillTestCredentials('admin');
                    }}
                    className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-4 hover:bg-red-50 hover:border-red-200 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">Coordenação / Secretaria</h3>
                        <p className="text-xs text-gray-500">Gestão acadêmica e administrativa</p>
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
                        setProfEmail('tic@senaisp.edu.br');
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
                          <p className="text-xs text-white/70">Acesso técnico protegido por token</p>
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
                    {loginStep === 'admin_auth' ? 'Acesso Restrito' : loginStep === 'tic_auth' ? 'Login TIC' : 'Aceder à Conta'}
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    {loginStep === 'admin_auth' && 'Entre com uma conta de Coordenação ou Secretaria.'}
                    {loginStep === 'tic_auth' && `Acesso oculto para ${getRoleLabel('tic')} com token técnico.`}
                    {loginStep === 'prof_auth' && 'Bem-vindo de volta, Professor!'}
                    {loginStep === 'empresa_auth' && 'Área exclusiva para empresas parceiras.'}
                  </p>
                </div>

                <form
                  onSubmit={
                    loginStep === 'admin_auth' ? handleAdminLogin :
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
                      {loginStep === 'admin_auth' ? 'Palavra-passe administrativa' : loginStep === 'tic_auth' ? 'Token especial TIC' : 'Palavra-passe'}
                    </label>
                    <div className="relative">
                      {(loginStep === 'admin_auth' || loginStep === 'tic_auth') && (
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      )}
                      <input
                        id="login-password"
                        type="password"
                        value={loginStep === 'admin_auth' ? adminPassword : loginStep === 'tic_auth' ? ticToken : profSenha}
                        onChange={(e) => loginStep === 'admin_auth' ? setAdminPassword(e.target.value) : loginStep === 'tic_auth' ? setTicToken(e.target.value) : setProfSenha(e.target.value)}
                        placeholder="••••••••"
                        className={`w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition ${
                          (loginStep === 'admin_auth' || loginStep === 'tic_auth') ? 'pl-10' : ''
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
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-full shadow-lg shadow-red-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        A processar...
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
    </div>
  );
}
