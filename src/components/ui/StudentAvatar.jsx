import PersonAvatar, { getPersonAvatarUrl } from './PersonAvatar';

export const getStudentAvatarUrl = (aluno) => getPersonAvatarUrl(aluno);

export default function StudentAvatar({ aluno, size = 44, onClick, className = '' }) {
  return (
    <PersonAvatar
      person={aluno}
      size={size}
      onClick={onClick}
      className={`student-avatar-button ${className}`}
    />
  );
}
