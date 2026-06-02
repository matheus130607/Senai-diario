import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Selecione...',
  optionLabelKey = 'nome',
  optionValueKey = 'id',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    };

    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const filtered = options.filter(option => (
    String(option[optionLabelKey]).toLowerCase().includes(query.toLowerCase())
  ));
  const selected = options.find(option => String(option[optionValueKey]) === String(value));

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" onClick={() => setOpen(state => !state)} className="ds-input flex items-center justify-between gap-3 text-left">
        <div className="truncate">
          {selected ? selected[optionLabelKey] : <span className="text-zinc-400">{placeholder}</span>}
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
          <div className="border-b border-zinc-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Pesquisar..."
                className="ds-input ds-input-icon-left min-h-0 py-2 text-sm"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-auto py-1">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-zinc-500">Nenhuma opcao encontrada.</div>
            ) : (
              filtered.map(option => (
                <button
                  key={option[optionValueKey]}
                  type="button"
                  onClick={() => {
                    onChange(option[optionValueKey]);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm text-zinc-700 transition-colors duration-150 hover:bg-zinc-50"
                >
                  <span className="truncate">{option[optionLabelKey]}</span>
                  {String(option[optionValueKey]) === String(value) && <Check className="h-4 w-4 text-zinc-900" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
