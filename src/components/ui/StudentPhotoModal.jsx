import { useEffect } from 'react';
import { X } from 'lucide-react';
import { getPersonAvatarUrl } from './PersonAvatar';

export default function StudentPhotoModal({ aluno, onClose }) {
  useEffect(() => {
    if (!aluno) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aluno, onClose]);

  if (!aluno) return null;

  return (
    <div className="student-photo-modal" role="dialog" aria-modal="true" aria-label={`Foto de ${aluno.nome}`}>
      <button type="button" className="student-photo-backdrop" onClick={onClose} aria-label="Fechar foto ampliada" />
      <div className="student-photo-card">
        <button type="button" className="student-photo-close" onClick={onClose} aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
        <img
          src={getPersonAvatarUrl(aluno)}
          alt={`Foto simulada de ${aluno.nome}`}
          className="student-photo-image"
        />
        <div className="student-photo-caption">
          <strong>{aluno.nome}</strong>
          <span>{aluno.email || 'E-mail nao informado'}</span>
        </div>
      </div>
    </div>
  );
}
