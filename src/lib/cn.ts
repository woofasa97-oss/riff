import clsx, { type ClassValue } from 'clsx'

/** Tailwind class joiner. No tailwind-merge — conflicting classes are a code smell here. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
