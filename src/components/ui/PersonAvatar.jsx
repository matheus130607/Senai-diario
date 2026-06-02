import { useMemo, useState } from 'react';
import { AvatarInitial } from './DesignSystem';

const normalizeSeed = (person) => String(
  person?.id
  || person?.email
  || person?.nome
  || person?.name
  || 'person',
).trim();

const hashSeed = (seed) => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getPersonAvatarUrl = (person) => {
  const seed = normalizeSeed(person);
  const hash = hashSeed(seed);
  const collection = hash % 2 === 0 ? 'men' : 'women';
  const index = hash % 100;
  return `https://randomuser.me/api/portraits/${collection}/${index}.jpg`;
};

export default function PersonAvatar({ person, size = 44, onClick, className = '' }) {
  const [hasError, setHasError] = useState(false);
  const src = useMemo(() => getPersonAvatarUrl(person), [person]);
  const name = person?.nome || person?.name || person?.email || 'Pessoa';
  const style = { width: size, height: size };

  const content = hasError ? (
    <AvatarInitial name={name} className="h-full w-full rounded-full" />
  ) : (
    <img
      src={src}
      alt={`Foto simulada de ${name}`}
      className="h-full w-full rounded-full object-cover"
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`person-avatar-button ${className}`}
        style={style}
        onClick={onClick}
        aria-label={`Ampliar foto de ${name}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`person-avatar-button ${className}`} style={style} aria-hidden="true">
      {content}
    </div>
  );
}
