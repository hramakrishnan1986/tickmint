export function money(value: number): string {
  const rounded = Math.abs(Math.round(value)).toLocaleString('en-IN');
  return `${value < 0 ? '-' : ''}₹${rounded}`;
}
