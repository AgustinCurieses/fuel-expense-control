export function formatCurrency(amount: number): string {
  return '$ ' + amount.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR')
}
