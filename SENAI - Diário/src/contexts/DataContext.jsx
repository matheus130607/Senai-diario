import React, { createContext, useState, useEffect } from 'react';
import { initialData } from '../data/initialData';

export const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const savedData = localStorage.getItem('@senai_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (!parsed.empresas || parsed.empresas.length === 0) {
          parsed.empresas = initialData.empresas;
        }
        parsed.alunos = parsed.alunos.map(a => {
          if (!a.status) return { ...a, status: a.isPresent ? 'presente' : 'pendente', empresaId: a.empresaId || '' };
          return { ...a, empresaId: a.empresaId || '' };
        });
        return parsed;
      }
    } catch (error) {
      console.error('Erro ao carregar dados locais:', error);
    }
    return initialData;
  });

  useEffect(() => {
    try {
      localStorage.setItem('@senai_data', JSON.stringify(data));
    } catch (err) {
      console.error('Erro ao salvar dados locais:', err);
    }
  }, [data]);

  return (
    <DataContext.Provider value={{ data, setData }}>
      {children}
    </DataContext.Provider>
  );
}
