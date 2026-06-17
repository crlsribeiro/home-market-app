import { getInitials, avatarColor } from '../lib/utils';

interface AvatarProps { name: string; size?: 'sm' | 'md' | 'lg'; photoURL?: string | null; }

export function Avatar({ name, size = 'md', photoURL }: AvatarProps) {
  const sz = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }[size];
  if (photoURL) return <img src={photoURL} alt={name} className={`${sz} rounded-full object-cover flex-shrink-0`} />;
  return (
    <div className={`${sz} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0`} style={{ backgroundColor: avatarColor(name) }}>
      {getInitials(name)}
    </div>
  );
}
