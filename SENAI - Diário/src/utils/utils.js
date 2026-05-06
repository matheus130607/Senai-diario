// src/utils/utils.js
export const exportJSON = (data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `senai_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
};

export const exportExcelCSV = (alunosParaExportar, data, prefix = 'relatorio') => {
  const BOM = "\uFEFF";
  let csvContent = "Nome do Aluno;CPF;Email;Telefone;Turma;Empresa;Status de Presença\n";
  alunosParaExportar.forEach(aluno => {
    const turmaNome = data.turmas.find(t => t.id === aluno.turmaId)?.nome || "Sem Turma";
    const empresaNome = data.empresas.find(e => e.id === aluno.empresaId)?.nome || "Sem Empresa";
    const statusStr = aluno.status === 'presente' ? "Presente" : (aluno.status === 'falta' ? "Falta" : "Pendente");
    csvContent += `${aluno.nome};${aluno.cpf};${aluno.email};${aluno.telefone};${turmaNome};${empresaNome};${statusStr}\n`;
  });
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${prefix}_senai_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};