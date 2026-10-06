import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

const tones = [
  'bg-blue-500/15 text-blue-600 dark:text-blue-300',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
  'bg-violet-500/15 text-violet-600 dark:text-violet-300',
  'bg-amber-500/15 text-amber-600 dark:text-amber-300',
  'bg-rose-500/15 text-rose-600 dark:text-rose-300',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300',
];

function toneFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return tones[h % tones.length];
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');

const sizes = { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' };

/** Shows the image when it loads, otherwise colored initials derived from `name`. */
export function Avatar({
  name,
  src,
  size = 'sm',
  className,
}: {
  name: string;
  src?: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn('inline-flex shrink-0 select-none overflow-hidden rounded-full font-semibold', sizes[size], className)}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name} className="size-full object-cover" />}
      <AvatarPrimitive.Fallback className={cn('grid size-full place-items-center', toneFor(name))}>
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export function AvatarGroup({ names, max = 4, size = 'sm' }: { names: string[]; max?: number; size?: keyof typeof sizes }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((n) => (
        <Avatar key={n} name={n} size={size} className="ring-2 ring-background" />
      ))}
      {extra > 0 && (
        <span className={cn('grid place-items-center rounded-full bg-secondary font-semibold text-muted-foreground ring-2 ring-background', sizes[size])}>
          +{extra}
        </span>
      )}
    </div>
  );
}
