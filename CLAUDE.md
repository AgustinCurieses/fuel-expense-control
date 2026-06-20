# Fuel Expense Control — Municipalidad de Luján

App web de control de gastos de combustible para la Municipalidad de Luján, Buenos Aires, Argentina.
Permite importar crudos de YPF (Excel), gestionar tarjetas por área/secretaría, auditar cargas y generar reportes.

---

## Stack

- **Next.js 15** (App Router) + **TypeScript** strict mode
- **Prisma ORM** + **PostgreSQL** en producción (Neon serverless) y desarrollo
- **Tailwind CSS**
- **ExcelJS** para generación de reportes Excel
- Repo: GitHub privado — [AgustinCurieses/fuel-expense-control](https://github.com/AgustinCurieses/fuel-expense-control)
- Path alias: `@/*` → `./src/*`
- Deploy: Vercel (un solo proyecto activo, vinculado a `main`)

---

## Comandos

```bash
npm run dev                          # Dev server en localhost:3000
npm run dev -- --hostname 0.0.0.0   # Acceso desde red local
npm run build                        # Build de producción (también corre prisma generate + db push)
npm run lint                         # ESLint
npm run seed                         # Seed contra la BD del .env (dev por defecto)
npm run reset-dev                    # Resetear BD y recargar seed
npm run update-identification        # Actualizar identificación de tarjetas desde FuelLogs
npx prisma studio                    # Ver BD en navegador
npx prisma generate                  # Regenerar cliente Prisma
npx prisma db push                   # Sincronizar schema con BD
npx tsc --noEmit --skipLibCheck src/app/api/generate-summary/route.ts  # Verificar TS sin compilar todo
git add . && git commit -m "mensaje" && git push

# Seed contra producción (Neon main):
DATABASE_URL="postgresql://...main..." npm run seed

# Push schema a BD específica:
DATABASE_URL="postgresql://..." npx prisma db push --accept-data-loss
```

No hay test suite configurado.

### Base de datos — Neon (PostgreSQL)
- **Dev** (`dev` branch): `.env` y `.env.local` apuntan al connection string de la branch `dev` de Neon
- **Prod** (`main` branch): Vercel env var `DATABASE_URL` apunta a la branch `main` de Neon
- El `postinstall` corre `prisma generate && prisma db push` automáticamente en cada deploy de Vercel
- Para seedear producción: `DATABASE_URL="...main..." npm run seed`
- **`prisma/dev.db` ya NO está en git** — fue removido. Ambos entornos usan PostgreSQL vía Neon.

---

## Estructura del Proyecto

```
fuel-expense-control/
├── prisma/
│   ├── schema.prisma                  # Modelos de BD
│   ├── seed.ts                        # Seed con 235 tarjetas reales
│   ├── reset-dev.ts                   # Reset BD desarrollo
│   └── update-card-identification.ts
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Dashboard principal
│   │   ├── login/                     # Página de login
│   │   ├── import/                    # Importación de Excel crudo YPF
│   │   ├── reports/                   # Reportes y filtros
│   │   ├── cards/                     # Gestión de tarjetas
│   │   ├── alerts/                    # Alertas de combustible
│   │   ├── areas/                     # Gestión de áreas
│   │   ├── admin/                     # Panel de administración (audit log)
│   │   ├── superadmin/                # Panel superadmin (usuarios + config sistema)
│   │   ├── settings/
│   │   │   ├── page.tsx               # Configuración de importación
│   │   │   └── mapper/page.tsx        # Mapeo de columnas Excel
│   │   └── api/
│   │       ├── import-excel/          # Importación de crudos YPF
│   │       ├── generate-report/       # Reporte detallado por área
│   │       ├── generate-summary/      # Resumen Ejecutivo (~826 líneas)
│   │       ├── cards/                 # CRUD tarjetas + export Excel
      ├── cards/[id]/            # Editar tarjeta individual
      ├── cards/[id]/history/    # Historial de reasignaciones
      ├── cards/[id]/reassign/   # Reasignar tarjeta de área
│   │       ├── dashboard/             # Datos del dashboard
│   │       ├── facturas/              # Facturas y totales oficiales
      ├── facturas/total/        # Guardar total oficial por factura
│   │       ├── fuel-logs/             # Consulta de FuelLogs
│   │       ├── areas/                 # Gestión de áreas
│   │       ├── alerts/fuel-type/      # Alertas de cambio de combustible + export
│   │       ├── pending-cards/         # Tarjetas pendientes de asignación
      ├── pending-cards/assign/  # Asignar tarjeta pendiente a Card existente
│   │       ├── import-settings/       # Configuración de mapeo de columnas
│   │       ├── auth/me/               # Endpoint de sesión actual (valida cookie session_token)
│   │       ├── auth/login/            # POST — login real contra BD, setea cookie httpOnly
│   │       ├── auth/logout/           # POST — invalida token en BD, borra cookie
│   │       ├── admin/
│   │       │   ├── users/             # CRUD de usuarios
│   │       │   ├── users/[id]/        # Editar/eliminar usuario
│   │       │   └── audit/             # Logs de auditoría (paginado)
│   │       └── superadmin/
│   │           ├── auth/              # Autenticación superadmin por clave secreta
│   │           └── settings/          # Parámetros de sistema (SystemSettings)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── ui/                        # Librería de componentes reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx              # Focus trap + Escape + ARIA roles incluidos
│   │   │   ├── Toast.tsx
│   │   │   ├── Badge.tsx              # Variantes: success/warning/danger/info/neutral/navy
│   │   │   ├── Skeleton.tsx           # Placeholder animado para estados de carga
│   │   │   ├── StatCard.tsx           # KPI card de una línea (icon + label + value)
│   │   │   ├── PageHeader.tsx         # Header estándar de página (title/subtitle/actions, responsive)
│   │   │   ├── Spinner.tsx            # Usa currentColor (color via className)
│   │   │   ├── DropZone.tsx           # Drag & drop de Excel + callback onInvalidFile
│   │   │   └── SearchableSelect.tsx   # Combobox accesible por teclado
│   │   └── ProtectedRoute.tsx         # HOC que redirige a /login si no autenticado
│   ├── contexts/
│   │   ├── AuthContext.tsx            # Proveedor de sesión (client-side)
│   │   └── ToastContext.tsx           # Proveedor global de toasts
│   ├── lib/
│   │   ├── database.ts                # Singleton del cliente Prisma
│   │   ├── auth.ts                    # AuthService: login/logout client-side + localStorage
│   │   └── serverAuth.ts              # getSession / requireAuth / requireRole (server-side)
│   └── types/index.ts                 # Tipos centralizados
```

---

## Modelos de Base de Datos

**Prisma singleton:** `src/lib/database.ts`

### FuelLog — registro de cada carga
- `factura` (String?) — número de factura YPF al que pertenece
- `totalCost` (Float) — costo total en pesos argentinos
- `gallons` (Float) — ⚠️ almacena **LITROS**, no galones. **No renombrar.**
- `amount` (Float) — también almacena litros en algunos contextos
- `conductor` (String?) — nombre del conductor (dato del crudo YPF)
- `localidad` (String?) — localidad de la carga
- `dominio` (String?) — dominio/patente del vehículo (del crudo YPF)
- `mainAreaId` (String?) — FK a MainArea
- `subAreaId` (String?) — FK a SubArea
- `cardId` (String?) — FK a Card
- `status` (String) — `'IMPORTED'` o `'PENDING'`. **Siempre filtrar con `status: 'IMPORTED'`**
- `remito` (String?, unique) — clave de deduplicación

### FacturaTotal — total oficial por factura
- `factura` (String, unique)
- `totalOficial` (Float) — monto oficial según YPF

### Card — tarjeta YPF
- `cardType`: `"vehiculo"` o `"maquinaria"`
- `allowedFuel`: `"nafta"`, `"gasoil"`, o `"ambos"`
- `identification` (String?) — dominio del vehículo o nombre de la máquina
- `userId` es opcional (las tarjetas son globales a la organización)

### User — usuario del sistema
- `email` (String, unique)
- `role` (String) — `"admin"`, `"editor"`, o `"viewer"`
- `isActive` (Boolean) — permite desactivar sin eliminar
- `password` (String?) — hasheada con bcryptjs (rounds: 10)
- `sessionToken` (String?, unique) — token de sesión; se genera al login, se borra al logout

### AuditLog — registro de acciones
- `userId` / `userEmail` — quién realizó la acción
- `action` (String) — tipo de acción: `LOGIN`, `LOGOUT`, `IMPORT_EXCEL`, `ASSIGN_CARD`, `CREATE_USER`, `UPDATE_USER`, `DEACTIVATE_USER`, `SAVE_FACTURA_TOTAL`
- `entity` / `entityId` — entidad afectada (opcional)
- `detail` (String?) — JSON con detalles adicionales

### SystemSettings — parámetros de configuración del sistema
- Pares `key`/`value` (String, unique por key)
- Claves usadas: `org_name`, `org_province`, `card_inactivity_days`, `excel_sheet_index`, `billing_period`, `factura_tolerance_green`, `factura_tolerance_yellow`, `show_org_logo`

### Logo de la organización en el sidebar
- Archivo estático: `public/logo-municipalidad.png` (colocar manualmente)
- Toggle en `/superadmin` → tab Sistema → "Mostrar logo en el sidebar" (`show_org_logo: 'true'/'false'`)
- Cuando está activo, reemplaza el ícono de combustible por el logo. Cuando está inactivo, muestra el ícono por defecto.
- `MainLayout` lee el setting al montar y lo pasa al `Sidebar` via prop `showLogo`

### MainArea — secretaría/área principal
### SubArea — sub-área dependiente de MainArea
### CardAreaHistory — historial de reasignaciones de área por tarjeta
- Campos `validFrom`/`validTo`: al resolver el área de un FuelLog, usar el área vigente a la **fecha de la carga**, no el área actual de la tarjeta.

### Otros modelos: `ImportSettings`, `ImportMapping`

---

## Datos del Sistema

- **10 MainAreas:** Salud, Protección Ciudadana, Intendencia, Jefatura de Gabinete, Obras Públicas, Desarrollo Humano, Desarrollo Productivo, Economía, Gobierno, Servicios Públicos
- **76 SubAreas** distribuidas entre las áreas
- **235 tarjetas** reales (seed tiene 238 — hay 3 extras a corregir)

---

## Auth y Seguridad

### Sistema actual (implementado)
- Login con email + password en `/login` → llama `POST /api/auth/login`
- `AuthService` en `src/lib/auth.ts` — llama a la API real, guarda datos del usuario en `localStorage`
- `AuthContext` proveedor global; `ProtectedRoute` redirige a `/login` si no autenticado
- **Sesión via cookie httpOnly** `session_token` — el servidor la valida en cada request protegido
- `src/lib/serverAuth.ts` — `getSession()`, `requireAuth()`, `requireRole(minRole)` para rutas API

### Permisos por rol

| Ruta / Acción | viewer | editor | admin |
|---|---|---|---|
| Dashboard, Reportes, Alertas, Tarjetas (ver) | ✅ | ✅ | ✅ |
| Importar Excel, editar tarjetas, asignar pending | ❌ | ✅ | ✅ |
| Áreas, Configuración, Admin, Usuarios | ❌ | ❌ | ✅ |
| Superadmin | — | — | clave secreta aparte |

El sidebar filtra ítems según el rol del usuario. `MainLayout` redirige a `/` si el usuario intenta acceder a una ruta que supera su rol.

### Rutas API protegidas
- `requireRole('admin')`: `/api/admin/*`, `/api/areas` (write), `/api/import-settings` (POST)
- `requireRole('editor')`: `/api/import-excel`, `/api/cards` (write), `/api/cards/[id]/reassign`, `/api/pending-cards/assign`, `/api/facturas/total` (POST)
- Rutas GET sin protección backend (la protección es client-side via ProtectedRoute)

### Superadmin (`/superadmin`)
- Protegido por clave secreta fija `SUPERADMIN_KEY` en `.env.local` (independiente del sistema de usuarios)
- Permite: CRUD de usuarios (con contraseña), configuración de parámetros del sistema (`SystemSettings`)
- API: `/api/superadmin/auth` + `/api/superadmin/settings`

### Admin (`/admin`)
- Solo accesible con rol `admin`
- Muestra el log de auditoría paginado (50 por página)
- API: `/api/admin/audit`, `/api/admin/users`, `/api/admin/users/[id]`

### Usuario inicial (seed)
- Email: `admin@municipalidad.gob.ar` / Contraseña: `admin123`
- Rol: `admin`
- Creado automáticamente al correr `npm run seed`

### Seguridad implementada
- **Session timeout**: `AuthContext` desloguea automáticamente tras 30 minutos de inactividad (mousedown, keydown, scroll, touch). Se resetea con cualquier interacción.
- **Rate limiting en login**: máximo 5 intentos por IP en 15 minutos. Al superar el límite devuelve 429 con mensaje de espera. Se resetea con login exitoso. Implementado en memoria en `src/app/api/auth/login/route.ts` (se resetea al reiniciar el servidor).
- **`SUPERADMIN_KEY`**: cambiar el valor por defecto `"superadmin"` en las env vars de Vercel antes de usar en producción real.

---

## Tipos de Combustible

| Tipo | Productos en crudo YPF |
|------|------------------------|
| Nafta | `"NAFTA SUPER"`, `"INFINIA"` |
| Gasoil | `"INFINIA DIESEL"`, `"D.DIESEL 500"` |

⚠️ Verificar que `"D.DIESEL 500"` no se confunda con `"INFINIA DIESEL"` al clasificar.

---

## Flujos de Negocio Principales

### 1. Importación de Excel (`/api/import-excel`)
1. Lee Excel crudo de YPF (31 columnas), columnas configurables via `ImportSettings`
2. Busca tarjeta por número → asigna área según `CardAreaHistory` a la fecha de la carga
3. Si la tarjeta no existe → crea FuelLog con `status: 'PENDING'` y `cardNumber`
4. Si el REMITO ya existe y `factura` era null → actualiza solo el campo `factura` (no duplica)
5. Si el REMITO ya existe y `factura` ya tenía valor → descarta como duplicado
6. Almacena importes y litros con **4 decimales de precisión**
7. El campo FECHA puede venir como: Date object, número serial Excel, o string DD/MM/YYYY

### 2. Alertas de Combustible (`/api/alerts/fuel-type`)
- Si `cardType = "maquinaria"` o `allowedFuel = "ambos"` → **no genera alerta**
- Si `allowedFuel = "nafta"` y carga gasoil → alerta
- Si `allowedFuel = "gasoil"` y carga nafta → alerta
- Dashboard muestra máximo 5; `/alerts` muestra todas con exportación Excel

### 3. Pending Cards (`/api/pending-cards`)
- Lista FuelLogs con status PENDING
- Permite asignar un número de tarjeta desconocido a una Card existente → backfill de todos los logs relacionados

### 4. Export de Tarjetas (`GET /api/cards/export`)
- Sheet 1: Tarjetas Activas (cargas en últimos `card_inactivity_days` días — configurable en SystemSettings)
- Sheet 2: Tarjetas Inactivas

### 5. Validación de Factura (obligatorio)
1. Al terminar la importación, si el Excel contiene facturas, aparece un modal **bloqueado** (no se puede cerrar)
2. El modal muestra por cada factura: total calculado por la app vs campo para ingresar el total oficial de YPF
3. Cada factura se guarda individualmente con botón "Guardar" → muestra semáforo de diferencia:
   - 🟢 Diferencia ≤ `factura_tolerance_green` (default $1)
   - 🟡 Diferencia ≤ `factura_tolerance_yellow` (default $100)
   - 🔴 Diferencia supera tolerancia amarilla
4. El botón "Cerrar" solo se habilita cuando **todas** las facturas del import están validadas
5. **Si el usuario cierra el navegador** antes de validar: al volver a `/import` el modal reaparece automáticamente con las facturas pendientes; el dashboard muestra un banner rojo con link a `/import`
6. API: `GET /api/facturas` devuelve todas las facturas con `hasTotal: boolean`; `GET/POST /api/facturas/total` lee/guarda el total oficial
7. Tolerancias configurables en `/superadmin` → tab Sistema (`factura_tolerance_green`, `factura_tolerance_yellow`)

---

## Reportes Excel (ExcelJS)

### Reporte Detallado (`/api/generate-report`)
- Filtro: área + rango de fechas **O** número de factura (mutuamente excluyentes)
- Título: `"[Área] - Periodo DD/MM/YYYY Al DD/MM/YYYY"` o `"[Área] - Factura [número]"`
- Formato A4 landscape, Calibri 11, bordes medium
- Fila total: columnas A:F mergeadas con `"Total : "` + importe en columna G con `formatARS()`

### Resumen Ejecutivo (`/api/generate-summary/route.ts`, ~826 líneas)

**Layout:** 10 columnas A–J  
Anchos: `A=22, B=7, C=11, D=11, E=10, F=11, G=16, H=9, I=11, J=9`  
Paleta: navy `#1F3864`, azul claro `#BDD7EE`, azul KPI `#E8F0FE`

**Funciones helper:**
- `safeMerge(ws, range)` — unmerge antes de mergear (evita "Cannot merge already merged cells")
- `formatARSKPI(value)` — moneda argentina con $ y separadores correctos

**Secciones:**
1. Header (filas 1–2): institución + número de factura
2. KPIs (filas 4–5): Total Facturado, Vehículos Activos, Total Cargas, Precio/Litro
3. Consumo por Secretaría (filas 7–18): tabla 10 col con 4 tipos de combustible + Total Litros + % Litros
4. TOP 5 Vehículos (filas 20–26)
5. Distribución por Combustible (filas 28–33)
6. Análisis Comparativo (fila 34+):
   - Bloque 1: tabla comparativa vs factura anterior por área
   - Bloque 2: Evolución del Precio por Litro (labels row + values row)
   - Bloque 3: Concentración del Gasto (labels row + values row)

**Tipos de combustible en el reporte (orden fijo, siempre los 4):**
1. `Inf. Diesel (L)`
2. `Nafta Super (L)`
3. `Infinia (L)`
4. `D.Diesel 500 (L)`

---

## Sistema de Diseño

### Paleta de colores — SOLO `slate` y `navy`
**Nunca usar `gray-*` ni `blue-*`** en componentes UI. La paleta correcta es:

| Uso | Clase |
|-----|-------|
| Texto principal | `text-slate-800` |
| Texto secundario | `text-slate-600` / `text-slate-500` |
| Texto placeholder/hint | `text-slate-400` |
| Borde estándar | `border-slate-200` |
| Fondo hover | `hover:bg-slate-50` |
| Divisor de tabla | `divide-slate-100` / `border-slate-100` |
| Acento primario | `text-navy-600` / `bg-navy-600` |
| Acento suave | `bg-navy-50` / `text-navy-700` |
| Header de tabla | `bg-navy-600` con `text-white/80` |
| Focus ring | `focus:ring-navy-600 focus:border-navy-600` |

**No usar `shadow-sm`** en cards — solo `border border-slate-200`.

### Toasts — siempre `useToastContext`
```typescript
const { success, error, warning, info } = useToastContext()
// NUNCA usar alert() nativo ni el hook local useToast()
```
- Los toasts se renderizan en un **único contenedor apilado** dentro de `ToastProvider` (`fixed top-4 right-4 flex-col gap-2`). El `ToastComponent` NO es `fixed` — no agregar posicionamiento propio o se encimarán.
- Cada toast tiene `role="status"` + `aria-live` (`assertive` en errores, `polite` el resto).

### Componentes — usar los existentes, no reinventar
- **Header de página:** usar `<PageHeader title subtitle actions={...} />` — NO reimplementar el `<div><h1>...</div>` inline. Ya es responsive (`flex-col sm:flex-row`). Todas las páginas lo usan, excepto `/login` y `/superadmin` que tienen headers especiales (pantalla de acceso / panel oscuro).
- **Badges de estado:** usar `<Badge variant="success|warning|danger|info|neutral">`, no `<span>` inline con clases manuales
- **KPI cards simples:** usar `<StatCard icon label value iconBg />` para tarjetas de estadística de una línea
- **Loading states:** usar `<Skeleton className="h-4 w-24" />` con `animate-pulse`, no texto "Cargando..."
- **Modales:** usar `<Modal>` — ya tiene focus trap, cierre con Escape y ARIA roles. No necesita configuración extra.
- **Spinner:** usa `currentColor` (`border-t-current`) — controlar el color con `className="text-white"` etc.
- **Selects:**
  - `<Select>` (HTML nativo) — NO inyecta opción vacía; si necesitás un placeholder, pasalo como primera opción (`{ value: '', label: 'Todas...' }`)
  - `<SearchableSelect>` — combobox accesible por teclado (↑/↓/Enter/Escape), para listas largas (áreas, subáreas)
- **Confirmación de acciones destructivas:** usar `confirm()` del browser hasta que haya un componente de diálogo dedicado

### Accesibilidad
- `<html lang="es">` en `layout.tsx` — la app es 100% en español
- Botones de solo-ícono: siempre `aria-label` + `title` (tooltip nativo)
- Íconos decorativos: `aria-hidden="true"`
- Headers de tabla: `scope="col"`
- Columnas ordenables: `aria-sort="ascending|descending|none"`
- No usar `<h2>` en el layout si la página tiene su propio `<h1>` — el `<p>` en MainLayout es intencional

### Tema claro únicamente — NO dark mode
- La app está diseñada **solo para tema claro**. NO reintroducir el media-query `@media (prefers-color-scheme: dark)` en `globals.css` — flipea el `<body>` a fondo oscuro mientras las cards siguen blancas, rompiendo el contraste en celulares con modo oscuro del SO.

### Dashboard
- 4 KPI cards en grid `sm:grid-cols-2 xl:grid-cols-4`:
  1. Última Factura
  2. Precios de Combustible
  3. Alertas de Combustible (con link a `/alerts`)
  4. Estado del Sistema (tarjetas pendientes + última importación)
- Skeleton loading para KPI cards, tabla de consumo y lista de facturas

### Reportes (`/reports`)
- Summary cards solo visibles cuando hay resultados (`fuelLogs.length > 0`)
- `loadData` solo carga áreas y facturas (no import-settings — el modal de settings fue eliminado)

### Mobile responsive
- **Tablas con muchas columnas**: en mobile (`md:hidden`) se usa card-list view; en desktop la tabla normal. Aplicado en: cards (tabla principal + pending cards), admin (audit log), alerts (dentro de cada grupo de área).
- **Reports**: tabla de datos con scroll horizontal + indicador "← Deslizá para ver más" en mobile.
- **`PageHeader`**: ya responsive (`flex-col sm:flex-row`) — se aplica automáticamente en todas las páginas.
- **Padding del layout**: `p-3 sm:p-6` en main, `px-3 sm:px-6` en header — reducido en mobile.
- **No agregar** tablas de muchas columnas sin implementar la vista mobile alternativa.

### Resumen Ejecutivo (`/api/generate-summary`)
- **Distribución por combustible**: usa query separado `allFuelLogs` SIN filtro `cardId: { not: null }` para incluir logs de tarjetas pendientes de asignación. El query principal `currLogs` mantiene el filtro para cálculos por área/vehículo.
- **Clasificación de combustibles**: maneja variantes "GAS OIL", "GASOIL", "D. DIESEL" además de los nombres estándar YPF.
- **Row heights**: usar el workaround de `customHeight: true` en el modelo interno (ver sección ExcelJS).

---

## Convenciones Críticas

### Formato de moneda argentina
`$ 1.234.567,89` — punto para miles, coma para decimales, espacio después del $

```typescript
function formatARS(amount: number): string {
  return '$ ' + amount.toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
```

### Filtros obligatorios en queries
```typescript
where: { factura: facturaId, status: 'IMPORTED' }
```

### previousByArea — estructura de datos
Viene de un `groupBy` de Prisma mapeado manualmente. Acceder con `.totalCost` directamente, **NO** con `._sum?.totalCost`:
```typescript
{ mainAreaId: string, areaName: string, totalCost: number }
const previousArea = previousByArea.find(p => p.areaName === areaName)
```

### Buscar factura anterior
```typescript
const allFacturas = await prisma.fuelLog.findMany({
  where: { factura: { not: null }, status: 'IMPORTED' },
  select: { factura: true, date: true },
  distinct: ['factura'],
  orderBy: { date: 'asc' }
})
const facturaList = allFacturas.map(f => f.factura).filter(Boolean)
const currentIndex = facturaList.indexOf(currentFactura)
const previousFactura = currentIndex > 0 ? facturaList[currentIndex - 1] : null
```

### Fechas
- Guardar sin hora (truncadas a medianoche)
- **No usar** `new Date(dateString)` para strings tipo `"2025-10-01"` → usar `split('-')` para evitar desfase UTC-3

### Set con TypeScript
`[...new Set()]` no funciona con la config del proyecto → usar `Array.from(new Set())`

### Next.js 15 — params async en route handlers dinámicos
En Next.js 15 los params de rutas dinámicas son `Promise`. Siempre usar:
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // ...
}
```
**NO usar** `{ params }: { params: { id: string } }` (sintaxis de Next.js 14 — rompe el build).

---

## Reglas Críticas para Edición de Archivos

### NUNCA usar str_replace en bloques de más de 50 líneas
Para reemplazos grandes, usar PowerShell splice con UTF-8 explícito:
```powershell
$lines = Get-Content "src/app/api/generate-summary/route.ts"
$newContent = Get-Content "nuevo_contenido.ts"
$before = $lines[0..($startLine - 1)]
$after = $lines[$endLine..($lines.Length - 1)]
$result = $before + $newContent + $after
[System.IO.File]::WriteAllText(
  (Resolve-Path "src/app/api/generate-summary/route.ts"),
  ($result -join "`n"),
  [System.Text.UTF8Encoding]::new($false)
)
```

### SIEMPRE guardar con UTF-8 sin BOM
```powershell
$content = [System.IO.File]::ReadAllText(
  (Resolve-Path "archivo.ts"),
  [System.Text.Encoding]::UTF8
)
[System.IO.File]::WriteAllText(
  (Resolve-Path "archivo.ts"),
  $content,
  [System.Text.UTF8Encoding]::new($false)
)
```

### NUNCA usar Set-Content para archivos TypeScript
`Set-Content` corrompe caracteres especiales (tildes, ñ, —, Δ, ▲▼). Usar siempre `[System.IO.File]::WriteAllText`.

### NUNCA ejecutar npm run dev en modo bloqueante
Si necesitás el servidor Y hacer un request, usar dos terminales separadas o loggear a archivo:
```typescript
import fs from 'fs'
fs.appendFileSync('debug.log', JSON.stringify(data) + '\n')
```

### ExcelJS
- Escribir siempre en la **primera celda** del rango mergeado
- Para que `row.height` funcione en ExcelJS 4.x hay que forzar `customHeight: true` en el modelo interno:
```typescript
const r = ws.getRow(rowNum)
r.height = h
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const model = (r as any)._model ?? (r as any).model
if (model) { model.height = h; model.customHeight = true }
```
Sin esto, ExcelJS no escribe el atributo `customHeight="1"` en el XML y Excel ignora la altura.

---

## Problemas Conocidos

| Problema | Estado |
|----------|--------|
| 238 tarjetas en seed en lugar de 235 (3 extras) | Pendiente |
| `SUPERADMIN_KEY="superadmin"` trivialmente adivinable en producción | Pendiente — cambiar en Vercel env vars |
| `card_inactivity_days` en BD de producción puede tener valor viejo (30) | Pendiente — actualizar desde `/superadmin` |
| `row.height` en ExcelJS no aplica sin forzar `customHeight` en el modelo interno | ✅ Resuelto (workaround en `RH` y `RH2`) |
| Distribución por Combustible solo muestra 2 de 4 tipos | ✅ Resuelto (query separado sin filtro `cardId`, clasificación más robusta) |
| 20 tarjetas con patente válida tenían `allowedFuel="ambos"` incorrectamente | ✅ Corregidas en seed.ts y aplicadas en Neon |
| `dev.db` commiteado en git exponiendo datos del seed en producción | ✅ Resuelto (removido de git tracking) |
| App deployada en Vercel con SQLite + dev.db en lugar de PostgreSQL | ✅ Resuelto (migrado a Neon PostgreSQL) |
| Vulnerabilidad de seguridad en Next.js 14.0.4 | ✅ Resuelto (upgrade a Next.js 15.5.x) |
| Params async no tipados en route handlers dinámicos (breaking change Next.js 15) | ✅ Resuelto |
| Sin timeout de sesión ni rate limiting en login | ✅ Resuelto (30 min inactividad + 5 intentos/15 min) |
| Badge de inactividad de tarjetas solo visible al exportar | ✅ Resuelto (badge en tabla + API retorna `isInactive`) |
| `/api/auth/me` devuelve usuario hardcodeado — sin validación backend real | ✅ Resuelto |
| Paleta gray/blue mezclada con slate/navy | ✅ Resuelto |
| `alert()`/`confirm()` nativos | ✅ Resuelto |
| Modal sin focus trap, Escape ni ARIA roles | ✅ Resuelto |
| Dashboard con 3 KPIs mezclando alertas + sistema | ✅ Resuelto (4 KPIs separados) |
| Paleta vieja en Spinner/DropZone + modal de validación | ✅ Resuelto |
| Toasts apilados en la misma posición | ✅ Resuelto |
| `<Select>` con opción vacía duplicada | ✅ Resuelto |
| `SearchableSelect` no usable por teclado | ✅ Resuelto |
| `<html lang="en">` + dark-mode media query | ✅ Resuelto |
| Headers inline duplicados en cada página | ✅ Resuelto (`PageHeader`) |
| Sin versión mobile para tablas con muchas columnas | ✅ Resuelto (card-list view en mobile) |

---

## Inactividad de Tarjetas

### Cómo funciona
- El parámetro `card_inactivity_days` (configurable en `/superadmin` → tab Sistema, **default: 15 días**) define el umbral de inactividad.
- **`GET /api/cards`** incluye `lastActivityDate` e `isInactive` por cada tarjeta (calculado contra el umbral). La tabla de `/cards` muestra badge **"Inactiva"** en tarjetas sin cargas recientes.
- **`GET /api/cards/export`** genera un Excel con Sheet 1 (Activas) y Sheet 2 (Inactivas).

### Lo que NO hace
- El dashboard no usa este parámetro.
- El sistema de alertas no notifica tarjetas inactivas.

### Nota sobre producción
Si la BD de Neon tiene el valor `card_inactivity_days = '30'` (del seed anterior), hay que actualizarlo desde `/superadmin` → tab Sistema → "Días de inactividad de tarjetas" → guardar con 15.

---

## Pendientes (orden de prioridad)

1. **Credenciales de producción** — cambiar `SUPERADMIN_KEY` en Vercel env vars (actualmente `"superadmin"`) y la contraseña del usuario admin desde `/superadmin`
2. **`card_inactivity_days` en Neon** — verificar/actualizar a 15 desde `/superadmin` → tab Sistema
3. **Dominio propio** — configurar DNS en Vercel
4. **3 tarjetas extra en seed** — revisar y corregir las 3 tarjetas sobrantes (seed tiene 238, deberían ser 235)

---

## Tarjetas Pendientes de Corrección (allowedFuel)
Las 20 tarjetas con `allowedFuel="ambos"` incorrectamente asignado fueron corregidas en seed.ts y aplicadas en la BD de Neon (producción y dev) al correr el seed con `upsert`.

Valores correctos:
- **nafta:** OHE179, AB043WX, AE377RL, AF430TL, AG857AX, AG857AY, AG857AZ, AB043WS
- **gasoil:** aa873nz, DFJ05, AF689RJ, AF729ND, AF729WZ, AF772NP, AF747XK, AF781BZ, DOQ869, AH230ZY, AH132QR, AF734LF, AH369YQ, CQY69
---

## Contexto Municipal

- La municipalidad genera **órdenes de pago por secretaría** → la suma de todos los desgloses DEBE ser exacta al total de la factura YPF
- YPF factura por **quincena** (1–15 y 16–fin de mes)
- El campo FACTURA en el crudo puede venir **vacío** si las cargas aún no fueron facturadas
- Algunos vehículos de Protección Ciudadana cargan ambos combustibles (patrulleros flex) → **son legítimos**, no generan alerta
- Tarjetas de maquinaria y delegaciones pueden cargar cualquier combustible sin alerta
- El presupuesto anual por área es **externo** a la app (lo maneja Economía)