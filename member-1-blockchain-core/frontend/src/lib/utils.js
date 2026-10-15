/**
 * Utility function to combine and filter class names
 */
export function cn(...inputs) {
  return inputs
    .flat(Infinity)
    .filter(Boolean)
    .join(' ');
}
