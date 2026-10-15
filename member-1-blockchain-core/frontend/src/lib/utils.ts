/**
 * Utility function to combine and filter class names
 */
export function cn(...inputs: any[]): string {
  return inputs
    .flat(Infinity)
    .filter(Boolean)
    .join(' ');
}
