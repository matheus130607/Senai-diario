// src/hooks/useCrudOperations.js
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
  deleteAlunoRecord,
  deleteEmpresaRecord,
  deleteProfessorRecord,
  deleteTurmaRecord,
  saveAlunoRecord,
  saveEmpresaRecord,
  saveProfessorRecord,
  saveTurmaRecord,
} from '../services/supabaseDataService';

export const emptyTurmaForm = {
  nome: '',
  dataInicio: '',
  dataFim: '',
  status: 'Ativo',
  quantidadeAulas: '',
};

export const emptyEmpresaForm = {
  nome: '',
  cnpj: '',
  endereco: '',
  email: '',
  senha: '',
};

export const useCrudOperations = (data, setData, showToast, requestConfirm) => {
  const showCrudError = (action, error) => {
    console.error(`Erro ao ${action}:`, error);
    alert(`Não foi possível salvar a operação no Supabase: ${error.message || 'verifique o console para mais detalhes.'}`);
  };
  const isTurmaVinculavel = (turma) => ['Ativo', 'Pausado'].includes(turma?.status);
  const turmasVinculaveisIds = new Set(data.turmas.filter(isTurmaVinculavel).map((turma) => turma.id));

  // TURMAS
  const saveTurma = async (e, editingTurma, formTurma, setEditingTurma, setFormTurma) => {
    e.preventDefault();

    try {
      if (isSupabaseConfigured) {
        const savedTurma = await saveTurmaRecord({ id: editingTurma, ...formTurma });
        setData(prev => ({
          ...prev,
          turmas: editingTurma
            ? prev.turmas.map(t => t.id === editingTurma ? savedTurma : t)
            : [savedTurma, ...prev.turmas],
        }));
      } else if (editingTurma) {
        setData(prev => ({ ...prev, turmas: prev.turmas.map(t => t.id === editingTurma ? { ...t, ...formTurma } : t) }));
      } else {
        setData(prev => ({ ...prev, turmas: [{ id: 't' + Date.now(), ...formTurma }, ...prev.turmas] }));
      }

      showToast(editingTurma ? 'Turma atualizada!' : 'Turma criada!');
      setFormTurma(emptyTurmaForm);
      setEditingTurma(null);
    } catch (error) {
      showCrudError('salvar turma', error);
    }
  };

  const deleteTurma = (id) => {
    requestConfirm('Excluir Turma', 'Tem certeza? Isso pode deixar alunos sem turma.', async () => {
      try {
        if (isSupabaseConfigured) {
          await deleteTurmaRecord(id);
        }
        setData(prev => ({
          ...prev,
          turmas: prev.turmas.filter(t => t.id !== id),
          professores: prev.professores.map(prof => ({
            ...prof,
            turmas: prof.turmas.filter(turmaId => turmaId !== id),
          })),
          alunos: prev.alunos.map(aluno => aluno.turmaId === id ? { ...aluno, turmaId: '' } : aluno),
        }));
        showToast('Turma excluida!');
      } catch (error) {
        showCrudError('excluir turma', error);
      }
    });
  };

  // PROFESSORES
  const saveProfessor = async (e, editingProfessor, formProf, setEditingProfessor, setFormProf) => {
    e.preventDefault();

    try {
      const professorParaSalvar = {
        ...formProf,
        turmas: Array.isArray(formProf.turmas)
          ? formProf.turmas.filter((turmaId) => turmasVinculaveisIds.has(turmaId))
          : [],
      };

      if (isSupabaseConfigured) {
        const savedProfessor = await saveProfessorRecord({ id: editingProfessor, ...professorParaSalvar });
        setData(prev => ({
          ...prev,
          professores: editingProfessor
            ? prev.professores.map(p => p.id === editingProfessor ? savedProfessor : p)
            : [savedProfessor, ...prev.professores],
        }));
      } else if (editingProfessor) {
        setData(prev => ({ ...prev, professores: prev.professores.map(p => p.id === editingProfessor ? { ...p, ...professorParaSalvar } : p) }));
      } else {
        setData(prev => ({ ...prev, professores: [{ id: 'p' + Date.now(), ...professorParaSalvar }, ...prev.professores] }));
      }

      showToast(editingProfessor ? 'Professor atualizado!' : 'Professor criado!');
      setFormProf({ nome: '', cpf: '', nif: '', telefone: '', email: '', senha: '', turmas: [] });
      setEditingProfessor(null);
    } catch (error) {
      showCrudError('salvar professor', error);
    }
  };

  const deleteProfessor = (id) => {
    requestConfirm('Excluir Professor', 'Tem certeza que deseja excluir este professor?', async () => {
      try {
        if (isSupabaseConfigured) {
          await deleteProfessorRecord(id);
        }
        setData(prev => ({ ...prev, professores: prev.professores.filter(p => p.id !== id) }));
        showToast('Professor excluido!');
      } catch (error) {
        showCrudError('excluir professor', error);
      }
    });
  };

  // EMPRESAS
  const saveEmpresa = async (e, editingEmpresa, formEmpresa, setEditingEmpresa, setFormEmpresa) => {
    e.preventDefault();

    try {
      if (isSupabaseConfigured) {
        const savedEmpresa = await saveEmpresaRecord({ id: editingEmpresa, ...formEmpresa });
        setData(prev => ({
          ...prev,
          empresas: editingEmpresa
            ? prev.empresas.map(emp => emp.id === editingEmpresa ? savedEmpresa : emp)
            : [savedEmpresa, ...prev.empresas],
        }));
      } else if (editingEmpresa) {
        setData(prev => ({ ...prev, empresas: prev.empresas.map(emp => emp.id === editingEmpresa ? { ...emp, ...formEmpresa } : emp) }));
      } else {
        setData(prev => ({ ...prev, empresas: [{ id: 'e' + Date.now(), ...formEmpresa }, ...prev.empresas] }));
      }

      showToast(editingEmpresa ? 'Empresa atualizada!' : 'Empresa registada!');
      setFormEmpresa(emptyEmpresaForm);
      setEditingEmpresa(null);
    } catch (error) {
      showCrudError('salvar empresa', error);
    }
  };

  const deleteEmpresa = (id) => {
    requestConfirm('Excluir Empresa', 'Excluir esta empresa? Alunos vinculados ficarao sem empresa.', async () => {
      try {
        if (isSupabaseConfigured) {
          await deleteEmpresaRecord(id);
        }
        setData(prev => {
          const alunosAtualizados = prev.alunos.map(a => a.empresaId === id ? { ...a, empresaId: '' } : a);
          return { ...prev, alunos: alunosAtualizados, empresas: prev.empresas.filter(emp => emp.id !== id) };
        });
        showToast('Empresa excluida!');
      } catch (error) {
        showCrudError('excluir empresa', error);
      }
    });
  };

  // ALUNOS
  const saveAluno = async (e, editingAluno, formAluno, setEditingAluno, setFormAluno) => {
    e.preventDefault();

    try {
      const alunoParaSalvar = {
        ...formAluno,
        turmaId: turmasVinculaveisIds.has(formAluno.turmaId) ? formAluno.turmaId : '',
      };

      if (isSupabaseConfigured) {
        const savedAluno = await saveAlunoRecord({ id: editingAluno, ...alunoParaSalvar });
        setData(prev => ({
          ...prev,
          alunos: editingAluno
            ? prev.alunos.map(a => a.id === editingAluno ? { ...savedAluno, status: a.status } : a)
            : [savedAluno, ...prev.alunos],
        }));
      } else if (editingAluno) {
        setData(prev => ({ ...prev, alunos: prev.alunos.map(a => a.id === editingAluno ? { ...a, ...alunoParaSalvar } : a) }));
      } else {
        setData(prev => ({ ...prev, alunos: [{ id: 'a' + Date.now(), ...alunoParaSalvar, status: 'pendente' }, ...prev.alunos] }));
      }

      showToast(editingAluno ? 'Aluno atualizado!' : 'Aluno registado!');
      setFormAluno({ nome: '', cpf: '', telefone: '', email: '', turmaId: '', empresaId: '' });
      setEditingAluno(null);
    } catch (error) {
      showCrudError('salvar aluno', error);
    }
  };

  const deleteAluno = (id) => {
    requestConfirm('Excluir Aluno', 'Tem certeza que deseja excluir este aluno?', async () => {
      try {
        if (isSupabaseConfigured) {
          await deleteAlunoRecord(id);
        }
        setData(prev => ({ ...prev, alunos: prev.alunos.filter(a => a.id !== id) }));
        showToast('Aluno excluido!');
      } catch (error) {
        showCrudError('excluir aluno', error);
      }
    });
  };

  return { saveTurma, deleteTurma, saveProfessor, deleteProfessor, saveEmpresa, deleteEmpresa, saveAluno, deleteAluno };
};
