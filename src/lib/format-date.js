export function formatDate(dateInput) {
  return new Date(dateInput).toISOString().substring(0, 16).replace('T', ' ');
}
