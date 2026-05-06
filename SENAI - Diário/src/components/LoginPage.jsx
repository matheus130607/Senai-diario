// src/components/LoginPage.jsx
import React, { useState } from 'react';
import { User, Building, Shield, ChevronRight, ChevronLeft, KeyRound, AlertCircle } from 'lucide-react';

export default function LoginPage({ 
  data, setCurrentUser, setGlobalLoading, 
  loginStep, setLoginStep, adminPassword, setAdminPassword, 
  profEmail, setProfEmail, profSenha, setProfSenha, loginError, setLoginError 
}) {
  
  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      setGlobalLoading(true);
      setTimeout(() => {
        setCurrentUser({ role: 'admin' });
        setLoginError('');
        setAdminPassword('');
        setGlobalLoading(false);
      }, 800);
    } else {
      setLoginError('Senha de administrador incorreta.');
    }
  };

  const handleProfLogin = (e) => {
    e.preventDefault();
    const prof = data.professores.find(p => p.email === profEmail && p.senha === profSenha);
    if (prof) {
      setGlobalLoading(true);
      setTimeout(() => {
        setCurrentUser({ role: 'professor', ...prof });
        setLoginError('');
        setProfEmail('');
        setProfSenha('');
        setGlobalLoading(false);
      }, 800);
    } else {
      setLoginError('E-mail ou palavra-passe incorretos.');
    }
  };

  const handleEmpresaLogin = (e) => {
    e.preventDefault();
    const emp = data.empresas.find(emp => emp.email === profEmail && emp.senha === profSenha);
    if (emp) {
      setGlobalLoading(true);
      setTimeout(() => {
        setCurrentUser({ role: 'empresa', ...emp });
        setLoginError('');
        setProfEmail('');
        setProfSenha('');
        setGlobalLoading(false);
      }, 800);
    } else {
      setLoginError('E-mail ou palavra-passe incorretos.');
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-white">
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2070')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-slate-900/80 to-transparent"></div>
        <div className="absolute inset-0 bg-red-900/20 mix-blend-multiply"></div>
        
        <div className="relative z-10 flex flex-col justify-end p-16 w-full text-white">
          <div className="mb-auto mt-8">
            <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/SENAI_S%C3%A3o_Paulo_logo.png" alt="SENAI SP" className="h-12 w-auto object-contain bg-white p-2 rounded" />
          </div>
          <div>
            <div className="w-12 h-1 bg-red-600 mb-6"></div>
            <h1 className="text-4xl font-bold mb-4 leading-tight">Educação para a <br/>Indústria do Futuro</h1>
            <p className="text-lg text-slate-300 font-light max-w-lg">
              Bem-vindo ao Portal de Gestão Escolar. Registe presenças, acompanhe o desempenho dos alunos e conecte a sala de aula às empresas parceiras.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-16">
        <div className="w-full max-w-md flex lg:hidden justify-center mb-10">
          <img src="https://upload.wikimedia.org/wikipedia/commons/8/8c/SENAI_S%C3%A3o_Paulo_logo.png" alt="SENAI" className="h-10 object-contain" />
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-500">
          
          {loginStep === 'select' && (
            <>
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900">Aceder à Plataforma</h2>
                <p className="text-slate-500 mt-2 text-sm">Selecione o seu perfil de utilizador para iniciar sessão.</p>
              </div>

              <div className="space-y-4">
                <button onClick={() => setLoginStep('prof_auth')} className="w-full group flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:border-red-500 hover:shadow-md transition-all bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 text-red-600 flex items-center justify-center group-hover:bg-red-50">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Sou Professor</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Aceder ao diário de classe eletrónico</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-red-500" />
                </button>

                <button onClick={() => setLoginStep('empresa_auth')} className="w-full group flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:border-slate-800 hover:shadow-md transition-all bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-100">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Sou Empresa Parceira</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Acompanhar os alunos aprendizes</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </button>

                <button onClick={() => setLoginStep('admin_auth')} className="w-full group flex items-center justify-between p-5 border border-slate-200 rounded-xl hover:border-slate-800 hover:shadow-md transition-all bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-100">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Sou Administrador</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Gestão de turmas e sistema</p>
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}

          {loginStep !== 'select' && (
            <div className="animate-in slide-in-from-right-4">
              <button 
                type="button" 
                onClick={() => { setLoginStep('select'); setLoginError(''); }} 
                className="text-sm text-slate-500 hover:text-red-600 font-medium mb-8 flex items-center gap-1.5"
              >
                <ChevronLeft className="w-4 h-4" /> Voltar aos perfis
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900">
                  {loginStep === 'admin_auth' ? 'Acesso Restrito' : 'Aceder à Conta'}
                </h2>
                <p className="text-slate-500 mt-2 text-sm">
                  {loginStep === 'admin_auth' && 'Introduza a palavra-passe administrativa do sistema.'}
                  {loginStep === 'prof_auth' && 'Bem-vindo de volta, Professor! Insira os seus dados.'}
                  {loginStep === 'empresa_auth' && 'Área exclusiva para empresas parceiras.'}
                </p>
              </div>

              <form 
                onSubmit={
                  loginStep === 'admin_auth' ? handleAdminLogin : 
                  loginStep === 'prof_auth' ? handleProfLogin : 
                  handleEmpresaLogin
                } 
                className="space-y-5"
              >
                {loginStep !== 'admin_auth' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail Corporativo</label>
                    <input 
                      type="email" 
                      value={profEmail} 
                      onChange={(e) => setProfEmail(e.target.value)} 
                      placeholder="exemplo@senai.br" 
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none" 
                      required 
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Palavra-passe
                  </label>
                  <input 
                    type="password"
                    value={loginStep === 'admin_auth' ? adminPassword : profSenha} 
                    onChange={(e) => loginStep === 'admin_auth' ? setAdminPassword(e.target.value) : setProfSenha(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                    required 
                    autoFocus={loginStep === 'admin_auth'}
                  />
                  {loginError && (
                    <p className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {loginError}
                    </p>
                  )}
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-lg text-sm font-bold shadow-md mt-4"
                >
                  Entrar na Plataforma
                </button>
              </form>
            </div>
          )}

          <div className="mt-12 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>© {new Date().getFullYear()} SENAI São Paulo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
