// src/data/initialData.js
export const initialData = {
  turmas: [
    { id: 't1', nome: 'Desenvolvimento de Sistemas - Manhã' },
    { id: 't2', nome: 'Eletromecânica - Tarde' }
  ],
  professores: [
    { 
      id: 'p1', nome: 'Carlos Silva', cpf: '111.111.111-11', nif: '123456', 
      telefone: '(11) 99999-9999', email: 'carlos@senai.br', senha: '123', 
      turmas: ['t1', 't2'] 
    }
  ],
  empresas: [
    {
      id: 'e1', nome: 'TechCorp Indústrias', email: 'rh@techcorp.com', senha: '123'
    }
  ],
  alunos: [
    { 
      id: 'a1', nome: 'Ana Costa', cpf: '222.222.222-22', telefone: '(11) 88888-8888', 
      email: 'ana@aluno.senai.br', turmaId: 't1', empresaId: 'e1', status: 'presente' 
    },
    { 
      id: 'a2', nome: 'Bruno Souza', cpf: '333.333.333-33', telefone: '(11) 77777-7777', 
      email: 'bruno@aluno.senai.br', turmaId: 't2', empresaId: '', status: 'pendente' 
    },
    { 
      id: 'a3', nome: 'Carlos Mendes', cpf: '444.444.444-44', telefone: '(11) 66666-6666', 
      email: 'carlos@aluno.senai.br', turmaId: 't1', empresaId: 'e1', status: 'falta' 
    }
  ],
  config: {
    webhookUrl: ''
  }
};