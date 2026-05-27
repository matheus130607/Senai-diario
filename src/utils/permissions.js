export const ADMIN_ROLES = ['admin', 'coordenacao', 'secretaria', 'tic'];
export const FULL_ACCESS_ROLES = ['admin', 'coordenacao', 'secretaria', 'tic'];

export const ROLE_DEFINITIONS = {
  coordenacao: {
    label: 'Coordenação',
    scope: 'Visão estratégica e indicadores institucionais',
    permissions: [
      'Dashboards avançados',
      'Indicadores de frequência',
      'Alertas acadêmicos',
      'Relatórios consolidados',
      'Acompanhamento de comunicados automáticos',
    ],
  },
  secretaria: {
    label: 'Secretaria',
    scope: 'Operação administrativa e cadastros acadêmicos',
    permissions: [
      'Cadastro de alunos',
      'Cadastro de professores',
      'Cadastro de empresas',
      'Gestão de turmas e vínculos',
      'Relatórios operacionais',
    ],
  },
  professor: {
    label: 'Professor',
    scope: 'Turmas vinculadas',
    permissions: [
      'Gerenciamento das próprias turmas',
      'Registro de chamadas',
      'Observações de frequência',
      'Relatórios por turma',
    ],
  },
  empresa: {
    label: 'Empresa',
    scope: 'Aprendizes vinculados',
    permissions: [
      'Acompanhamento de aprendizes',
      'Relatórios de frequência',
      'Histórico completo de presença',
      'Indicadores por período',
    ],
  },
  tic: {
    label: 'TIC',
    scope: 'Super administração técnica',
    permissions: [
      'Gerenciamento total do sistema',
      'Reset de senhas',
      'Monitoramento e manutenção',
      'Ferramentas de debug',
      'Gerenciamento de permissões',
    ],
  },
  admin: {
    label: 'Administrador',
    scope: 'Administração legada',
    permissions: [
      'Gestão administrativa',
      'Cadastros',
      'Relatórios',
      'Configurações',
    ],
  },
};

export const isAdministrativeRole = (role) => ADMIN_ROLES.includes(role);

export const hasFullAccess = (role) => FULL_ACCESS_ROLES.includes(role);

export const getRoleLabel = (role) => ROLE_DEFINITIONS[role]?.label || 'Usuário';

export const getRoleScope = (role) => ROLE_DEFINITIONS[role]?.scope || 'Acesso personalizado';

export const getRolePermissions = (role) => ROLE_DEFINITIONS[role]?.permissions || [];

export const getVisibleTurmas = (data, currentUser) => {
  const turmas = Array.isArray(data?.turmas) ? data.turmas : [];
  const role = currentUser?.role;

  if (hasFullAccess(role) || role === 'secretaria') return turmas;

  if (role === 'professor') {
    const linkedTurmas = new Set(Array.isArray(currentUser?.turmas) ? currentUser.turmas : []);
    return turmas.filter((turma) => linkedTurmas.has(turma.id));
  }

  if (role === 'empresa') {
    const turmaIds = new Set(
      (data?.alunos || [])
        .filter((aluno) => aluno.empresaId === currentUser?.id)
        .map((aluno) => aluno.turmaId),
    );
    return turmas.filter((turma) => turmaIds.has(turma.id));
  }

  return [];
};

export const getVisibleStudents = (data, currentUser) => {
  const alunos = Array.isArray(data?.alunos) ? data.alunos : [];
  const role = currentUser?.role;

  if (hasFullAccess(role) || role === 'secretaria') return alunos;

  if (role === 'professor') {
    const linkedTurmas = new Set(Array.isArray(currentUser?.turmas) ? currentUser.turmas : []);
    return alunos.filter((aluno) => linkedTurmas.has(aluno.turmaId));
  }

  if (role === 'empresa') {
    return alunos.filter((aluno) => aluno.empresaId === currentUser?.id);
  }

  return [];
};

export const canManageAutomation = (role) => ['secretaria', 'coordenacao', 'tic', 'admin'].includes(role);

export const canManagePeople = (role) => ['secretaria', 'tic', 'admin'].includes(role);

export const canUseTechnicalTools = (role) => role === 'tic';

