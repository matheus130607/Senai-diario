import React from 'react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatFullDate() {
  try {
    return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return '';
  }
}

export default function DashboardShell({ title, subtitle, children }) {
  const greeting = getGreeting();
  const fullDate = formatFullDate();

  return (
    <div className="animate-in fade-in duration-500 pl-4 lg:pl-6">
      <div className="mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="text-left">
            <div className="text-lg font-semibold text-slate-800">{greeting} — que bom ver você de novo.</div>
            <div className="text-xs text-slate-500 mt-1 capitalize">{fullDate}</div>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}
