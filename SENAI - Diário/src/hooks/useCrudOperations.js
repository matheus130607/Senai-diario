// src/hooks/useCrudOperations.js
export const useCrudOperations = (data, setData, showToast, requestConfirm) => {
  
  // TURMAS
  const saveTurma = (e, editingTurma, formTurma, setEditingTurma, setFormTurma) => {
    e.preventDefault();
    if (editingTurma) {
      setData(prev => ({ ...prev, turmas: prev.turmas.map(t => t.id === editingTurma ? { ...t, ...formTurma } : t) }));
      showToast("Turma atualizada!");
    } else {
      setData(prev => ({ ...prev, turmas: [{ id: 't' + Date.now(), ...formTurma }, ...prev.turmas] }));
      showToast("Turma criada!");
    }
    setFormTurma({ nome: '' });
    setEditingTurma(null);
  };

  const deleteTurma = (id) => {
    requestConfirm("Excluir Turma", "Tem certeza? Isso pode deixar alunos sem turma.", () => {
      setData(prev => ({ ...prev, turmas: prev.turmas.filter(t => t.id !== id) }));
    });
  };

  // PROFESSORES
  const saveProfessor = (e, editingProfessor, formProf, setEditingProfessor, setFormProf) => {
    e.preventDefault();
    if (editingProfessor) {
      setData(prev => ({ ...prev, professores: prev.professores.map(p => p.id === editingProfessor ? { ...p, ...formProf } : p) }));
      showToast("Professor atualizado!");
    } else {
      setData(prev => ({ ...prev, professores: [{ id: 'p' + Date.now(), ...formProf }, ...prev.professores] }));
      showToast("Professor criado!");
    }
    setFormProf({ nome: '', cpf: '', nif: '', telefone: '', email: '', senha: '', turmas: [] });
    setEditingProfessor(null);
  };

  const deleteProfessor = (id) => {
    requestConfirm("Excluir Professor", "Tem certeza que deseja excluir este professor?", () => {
      setData(prev => ({ ...prev, professores: prev.professores.filter(p => p.id !== id) }));
    });
  };

  // EMPRESAS
  const saveEmpresa = (e, editingEmpresa, formEmpresa, setEditingEmpresa, setFormEmpresa) => {
    e.preventDefault();
    if (editingEmpresa) {
      setData(prev => ({ ...prev, empresas: prev.empresas.map(emp => emp.id === editingEmpresa ? { ...emp, ...formEmpresa } : emp) }));
      showToast("Empresa atualizada!");
    } else {
      setData(prev => ({ ...prev, empresas: [{ id: 'e' + Date.now(), ...formEmpresa }, ...prev.empresas] }));
      showToast("Empresa registada!");
    }
    setFormEmpresa({ nome: '', email: '', senha: '' });
    setEditingEmpresa(null);
  };

  const deleteEmpresa = (id) => {
    requestConfirm("Excluir Empresa", "Excluir esta empresa? Alunos vinculados ficarão sem empresa.", () => {
      setData(prev => {
        const alunosAtualizados = prev.alunos.map(a => a.empresaId === id ? { ...a, empresaId: '' } : a);
        return { ...prev, alunos: alunosAtualizados, empresas: prev.empresas.filter(emp => emp.id !== id) };
      });
    });
  };

  // ALUNOS
  const saveAluno = (e, editingAluno, formAluno, setEditingAluno, setFormAluno) => {
    e.preventDefault();
    if (editingAluno) {
      setData(prev => ({ ...prev, alunos: prev.alunos.map(a => a.id === editingAluno ? { ...a, ...formAluno } : a) }));
      showToast("Aluno atualizado!");
    } else {
      setData(prev => ({ ...prev, alunos: [{ id: 'a' + Date.now(), ...formAluno, status: 'pendente' }, ...prev.alunos] }));
      showToast("Aluno registado!");
    }
    setFormAluno({ nome: '', cpf: '', telefone: '', email: '', turmaId: '', empresaId: '' });
    setEditingAluno(null);
  };

  const deleteAluno = (id) => {
    requestConfirm("Excluir Aluno", "Tem certeza que deseja excluir este aluno?", () => {
      setData(prev => ({ ...prev, alunos: prev.alunos.filter(a => a.id !== id) }));
    });
  };

  return { saveTurma, deleteTurma, saveProfessor, deleteProfessor, saveEmpresa, deleteEmpresa, saveAluno, deleteAluno };
};
