import React, { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({ options = [], value, onChange, placeholder = 'Selecione...', optionLabelKey = 'nome', optionValueKey = 'id', className = '' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); } };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const filtered = options.filter(o => String(o[optionLabelKey]).toLowerCase().includes(query.toLowerCase()));
  const selected = options.find(o => String(o[optionValueKey]) === String(value));

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" onClick={() => setOpen(s => !s)} className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3">
        <div className="truncate">{selected ? selected[optionLabelKey] : <span className="text-slate-400">{placeholder}</span>}</div>
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
      </button>

      {open && (
        <div className="absolute mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg z-50">
          <div className="p-2">
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar..." className="w-full px-3 py-2 border border-slate-100 rounded-md text-sm bg-white text-slate-800 outline-none focus:ring-2 focus:ring-red-100" />
          </div>
          <div className="max-h-52 overflow-auto">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-slate-500">Nenhuma opção encontrada.</div>
            ) : (
              filtered.map(opt => (
                <button key={opt[optionValueKey]} type="button" onClick={() => { onChange(opt[optionValueKey]); setOpen(false); setQuery(''); }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm">{opt[optionLabelKey]}</button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
