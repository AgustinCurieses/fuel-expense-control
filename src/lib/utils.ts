export function getPageTitle(pathname: string): string {
  const pathMap: Record<string, string> = {
    '/': 'Dashboard',
    '/areas': 'Areas Management',
    '/cards': 'Card Assignment',
    '/settings/mapper': 'Excel Column Mapper',
  }
  
  return pathMap[pathname] || 'Dashboard'
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}
