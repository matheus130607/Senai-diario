// src/utils/utils.js
export const exportJSON = (data) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `somativa_backup_${new Date().toISOString().split('T')[0]}.json`;
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
  a.download = `${prefix}_somativa_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const statusLabel = (status) => {
  if (status === 'presente') return 'Presente';
  if (status === 'falta') return 'Falta';
  return 'Pendente';
};

export const exportPDFReport = ({
  alunosParaExportar = [],
  data,
  title = 'Relatorio de Assiduidade',
  subtitle = 'SENAI Diario Digital',
  prefix = 'relatorio',
  context = '',
}) => {
  const reportWindow = window.open('', '_blank');
  if (!reportWindow) {
    alert('Permita pop-ups para gerar o relatorio em PDF.');
    return;
  }

  const total = alunosParaExportar.length;
  const presentes = alunosParaExportar.filter(aluno => aluno.status === 'presente').length;
  const faltas = alunosParaExportar.filter(aluno => aluno.status === 'falta').length;
  const pendentes = alunosParaExportar.filter(aluno => aluno.status === 'pendente').length;
  const taxaPresenca = total === 0 ? 0 : Math.round((presentes / total) * 100);
  const taxaFaltas = total === 0 ? 0 : Math.round((faltas / total) * 100);
  const today = new Date();
  const fileDate = today.toLocaleDateString('pt-BR').replace(/\//g, '-');

  const rows = alunosParaExportar.map((aluno) => {
    const turmaNome = data.turmas.find(turma => turma.id === aluno.turmaId)?.nome || 'Sem turma';
    const empresaNome = data.empresas.find(empresa => empresa.id === aluno.empresaId)?.nome || 'Sem empresa';

    return `
      <tr>
        <td>
          <strong>${escapeHtml(aluno.nome)}</strong>
          <span>${escapeHtml(aluno.email)}</span>
        </td>
        <td>${escapeHtml(turmaNome)}</td>
        <td>${escapeHtml(empresaNome)}</td>
        <td>${escapeHtml(aluno.telefone || '-')}</td>
        <td><span class="status ${escapeHtml(aluno.status || 'pendente')}">${escapeHtml(statusLabel(aluno.status))}</span></td>
      </tr>
    `;
  }).join('');

  const html = `
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; }
    .header { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; border-bottom: 2px solid #d71920; padding-bottom: 18px; margin-bottom: 22px; }
    .brand { display: flex; gap: 14px; align-items: center; }
    .mark { background: #d71920; color: #fff; font-weight: 900; font-size: 18px; letter-spacing: -1px; padding: 7px 10px; transform: skew(-8deg); }
    .title h1 { margin: 0; font-size: 22px; letter-spacing: -.02em; }
    .title p { margin: 5px 0 0; color: #64748b; font-size: 12px; line-height: 1.5; }
    .meta { text-align: right; color: #475569; font-size: 11px; line-height: 1.55; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; background: #fafafa; }
    .card span { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 700; letter-spacing: .04em; }
    .card strong { display: block; margin-top: 6px; font-size: 24px; }
    .visuals { display: grid; grid-template-columns: 180px 1fr; gap: 18px; align-items: center; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 22px; }
    .donut { width: 128px; height: 128px; margin: auto; border-radius: 999px; background: conic-gradient(#0f8f5f 0 ${taxaPresenca}%, #d71920 ${taxaPresenca}% ${taxaPresenca + taxaFaltas}%, #e5e7eb ${taxaPresenca + taxaFaltas}% 100%); position: relative; }
    .donut::after { content: ""; position: absolute; inset: 14px; border-radius: 999px; background: #fff; }
    .donut-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; flex-direction: column; z-index: 1; font-weight: 800; font-size: 24px; }
    .donut-label span { color: #64748b; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
    .bars { display: grid; gap: 10px; }
    .bar-row { display: grid; grid-template-columns: 90px 1fr 42px; align-items: center; gap: 10px; color: #475569; font-size: 11px; font-weight: 700; }
    .track { height: 8px; border-radius: 99px; background: #eef2f7; overflow: hidden; }
    .fill { height: 100%; border-radius: 99px; }
    .green { background: #0f8f5f; }
    .red { background: #d71920; }
    .amber { background: #b7791f; }
    h2 { margin: 0 0 10px; color: #334155; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    th { text-align: left; background: #111827; color: #fff; padding: 9px; font-size: 9px; text-transform: uppercase; letter-spacing: .05em; }
    td { border-bottom: 1px solid #e5e7eb; padding: 9px; vertical-align: top; }
    td strong { display: block; font-size: 11px; }
    td span { display: block; color: #64748b; margin-top: 3px; font-size: 9.5px; }
    .status { display: inline-flex; width: auto; border-radius: 999px; padding: 4px 8px; font-size: 9px; font-weight: 800; text-transform: uppercase; }
    .presente { background: #ecfdf5; color: #047857; }
    .falta { background: #fef2f2; color: #b91c1c; }
    .pendente { background: #fffbeb; color: #92400e; }
    .footer { margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 10px; display: flex; justify-content: space-between; color: #64748b; font-size: 9.5px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="mark">SENAI</div>
      <div class="title">
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(subtitle)}${context ? `<br />${escapeHtml(context)}` : ''}</p>
      </div>
    </div>
    <div class="meta">
      <strong>Emitido em</strong><br />
      ${today.toLocaleDateString('pt-BR')} - ${today.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}<br />
      Arquivo: ${escapeHtml(prefix)}_${fileDate}.pdf
    </div>
  </div>

  <div class="summary">
    <div class="card"><span>Total</span><strong>${total}</strong></div>
    <div class="card"><span>Presentes</span><strong>${presentes}</strong></div>
    <div class="card"><span>Faltas</span><strong>${faltas}</strong></div>
    <div class="card"><span>Pendentes</span><strong>${pendentes}</strong></div>
  </div>

  <div class="visuals">
    <div class="donut"><div class="donut-label">${taxaPresenca}%<span>presenca</span></div></div>
    <div class="bars">
      <div class="bar-row"><span>Presentes</span><div class="track"><div class="fill green" style="width:${taxaPresenca}%"></div></div><span>${taxaPresenca}%</span></div>
      <div class="bar-row"><span>Faltas</span><div class="track"><div class="fill red" style="width:${taxaFaltas}%"></div></div><span>${taxaFaltas}%</span></div>
      <div class="bar-row"><span>Pendentes</span><div class="track"><div class="fill amber" style="width:${total === 0 ? 0 : Math.round((pendentes / total) * 100)}%"></div></div><span>${total === 0 ? 0 : Math.round((pendentes / total) * 100)}%</span></div>
    </div>
  </div>

  <h2>Detalhamento</h2>
  <table>
    <thead>
      <tr>
        <th>Aluno</th>
        <th>Turma</th>
        <th>Empresa</th>
        <th>Telefone</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>${rows || '<tr><td colspan="5">Nenhum registro encontrado.</td></tr>'}</tbody>
  </table>

  <div class="footer">
    <span>SENAI Diario Digital</span>
    <span>Relatorio gerado automaticamente</span>
  </div>
  <script>
    document.title = ${JSON.stringify(`${prefix}_somativa_${fileDate}`)};
    window.onload = () => window.print();
  </script>
</body>
</html>`;

  reportWindow.document.open();
  reportWindow.document.write(html);
  reportWindow.document.close();
};
