import { useState } from 'react';
import {
  Bell,
  Camera,
  CheckCircle2,
  History,
  KeyRound,
  Mail,
  Save,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react';
import { Button, SectionHeader, StatusBadge } from './ui/DesignSystem';
import { useUserSettings } from '../contexts/UserSettingsContext';
import { getRoleLabel, getRolePermissions, getRoleScope } from '../utils/permissions';
import { updateSupabasePassword } from '../services/supabaseDataService';
import AccessibilityPanel from './AccessibilityPanel';

const formatAccessDate = (value) => {
  if (!value) return 'Não registrado';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function UserProfile({ currentUser, showToast }) {
  const {
    settings,
    updateProfile,
    updateNotifications,
    registerPasswordUpdate,
  } = useUserSettings();
  const [profileForm, setProfileForm] = useState(settings.profile);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    updateProfile(profileForm);
    showToast?.('Perfil atualizado com sucesso.');
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const foto = String(reader.result || '');
      setProfileForm((prev) => ({ ...prev, foto }));
      updateProfile({ foto });
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordForm.next.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('A confirmação da senha não confere.');
      return;
    }

    try {
      await updateSupabasePassword({
        currentPassword: passwordForm.current,
        nextPassword: passwordForm.next,
        email: currentUser?.email || settings.profile.email,
      });
      setPasswordError('');
      setPasswordForm({ current: '', next: '', confirm: '' });
      registerPasswordUpdate();
      showToast?.('Senha atualizada no Supabase Auth.');
    } catch (error) {
      setPasswordError(error.message || 'Não foi possível atualizar a senha.');
    }
  };

  const permissions = getRolePermissions(currentUser?.role);

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Perfil do usuário"
        title="Conta e preferências"
        description="Gerencie informações pessoais, segurança, acessibilidade, notificações, permissões e histórico de acessos."
      />

      <div className="profile-layout">
        <section className="profile-main">
          <form onSubmit={handleProfileSubmit} className="profile-card">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="profile-avatar">
                {profileForm.foto ? (
                  <img src={profileForm.foto} alt="" />
                ) : (
                  <UserRound className="h-8 w-8 text-slate-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-950">{profileForm.nome || currentUser?.nome}</h3>
                <p className="text-sm text-slate-500">{getRoleLabel(currentUser?.role)} · {getRoleScope(currentUser?.role)}</p>
              </div>
              <label className="ds-button ds-button-neutral">
                <Camera className="h-4 w-4" />
                Trocar foto
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
              </label>
            </div>

            <div className="form-grid">
              <label>
                <span className="ds-label">Nome completo</span>
                <input
                  value={profileForm.nome}
                  onChange={(event) => setProfileForm({ ...profileForm, nome: event.target.value })}
                  className="ds-input"
                  required
                />
              </label>
              <label>
                <span className="ds-label">E-mail</span>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })}
                  className="ds-input"
                  required
                />
              </label>
              <label>
                <span className="ds-label">Telefone</span>
                <input
                  value={profileForm.telefone}
                  onChange={(event) => setProfileForm({ ...profileForm, telefone: event.target.value })}
                  className="ds-input"
                  placeholder="(11) 90000-0000"
                />
              </label>
              <label>
                <span className="ds-label">Cargo ou função</span>
                <input
                  value={profileForm.cargo}
                  onChange={(event) => setProfileForm({ ...profileForm, cargo: event.target.value })}
                  className="ds-input"
                  placeholder={getRoleLabel(currentUser?.role)}
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="ds-label">Observação profissional</span>
              <textarea
                value={profileForm.bio}
                onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })}
                className="ds-input min-h-[7rem]"
                placeholder="Preferências de contato, unidade, área ou observações administrativas."
              />
            </label>

            <div className="mt-5 flex justify-end border-t border-slate-200 pt-4">
              <Button type="submit" variant="primary">
                <Save className="h-4 w-4" />
                Salvar perfil
              </Button>
            </div>
          </form>

          <form onSubmit={handlePasswordSubmit} className="profile-card">
            <div className="mb-5 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-zinc-600" />
              <h3 className="text-base font-semibold text-slate-950">Alterar senha</h3>
            </div>
            <div className="form-grid">
              <label>
                <span className="ds-label">Senha atual</span>
                <input
                  type="password"
                  value={passwordForm.current}
                  onChange={(event) => setPasswordForm({ ...passwordForm, current: event.target.value })}
                  className="ds-input"
                />
              </label>
              <label>
                <span className="ds-label">Nova senha</span>
                <input
                  type="password"
                  value={passwordForm.next}
                  onChange={(event) => setPasswordForm({ ...passwordForm, next: event.target.value })}
                  className="ds-input"
                />
              </label>
              <label>
                <span className="ds-label">Confirmar senha</span>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })}
                  className="ds-input"
                />
              </label>
            </div>
            {passwordError && <p className="mt-3 text-sm text-red-600">{passwordError}</p>}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <span className="text-xs text-slate-500">Última alteração: {formatAccessDate(settings.security.passwordUpdatedAt)}</span>
              <Button type="submit">
                <ShieldCheck className="h-4 w-4" />
                Atualizar senha
              </Button>
            </div>
          </form>

          <div className="profile-card">
            <div className="mb-5 flex items-center gap-2">
              <Bell className="h-5 w-5 text-zinc-600" />
              <h3 className="text-base font-semibold text-slate-950">Notificações</h3>
            </div>
            <div className="notification-grid">
              {[
                ['weeklyReports', 'Relatórios semanais', Mail],
                ['absenceAlerts', 'Alertas de faltas', CheckCircle2],
                ['automationFailures', 'Falhas em comunicados automáticos', Smartphone],
                ['productUpdates', 'Atualizações do sistema', Bell],
              ].map(([key, label, Icon]) => (
                <label key={key} className="notification-option">
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-slate-500" />
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.notifications[key])}
                    onChange={(event) => updateNotifications({ [key]: event.target.checked })}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="profile-card">
            <AccessibilityPanel compact />
          </div>
        </section>

        <aside className="profile-side">
          <div className="profile-card">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-zinc-600" />
              <h3 className="text-base font-semibold text-slate-950">Permissões</h3>
            </div>
            <StatusBadge tone={currentUser?.role === 'tic' ? 'warning' : 'success'}>
              {getRoleLabel(currentUser?.role)}
            </StatusBadge>
            <div className="mt-4 space-y-2">
              {permissions.map((permission) => (
                <div key={permission} className="permission-row">
                  <CheckCircle2 className="h-4 w-4 text-zinc-600" />
                  <span>{permission}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="profile-card">
            <div className="mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-zinc-600" />
              <h3 className="text-base font-semibold text-slate-950">Histórico de acessos</h3>
            </div>
            <div className="space-y-3">
              {settings.accessLogs.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum acesso registrado ainda.</p>
              ) : settings.accessLogs.map((log) => (
                <div key={log.id} className="access-log-row">
                  <strong>{log.event === 'tic_login' ? 'Login TIC' : 'Login'}</strong>
                  <span>{formatAccessDate(log.at)}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
