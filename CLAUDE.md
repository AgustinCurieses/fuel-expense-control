# Fuel Expense Control — Municipalidad de Luján

App web de control de gastos de combustible para la Municipalidad de Luján, Buenos Aires, Argentina.
Permite importar crudos de YPF (Excel), gestionar tarjetas por área/secretaría, auditar cargas y generar reportes.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** strict mode
- **Prisma ORM** + **SQLite** (dev: `prisma/dev.db`) / **PostgreSQL** (prod — cambiar provider en schema.prisma)
- **Tailwind CSS**
- **ExcelJS** para generación de reportes Excel
- Repo: GitHub privado
- Path alias: `@/*` → `./src/*`

---

## Comandos

```bash
npm run dev                          # Dev server en localhost:3000
npm run dev -- --hostname 0.0.0.0   # Acceso desde red local
npm run build                        # Build de producción
npm run lint                         # ESLint
npm run seed                         # Seed con 235 tarjetas reales
npm run reset-dev                    # Resetear BD y recargar seed
npm run update-identification        # Actualizar identificación de tarjetas desde FuelLogs
npx prisma studio                    # Ver BD en navegador
npx prisma generate                  # Regenerar cliente Prisma
npx prisma db push                   # Sincronizar schema con BD (dev)
npx tsc --noEmit --skipLibCheck src/app/api/generate-summary/route.ts  # Verificar TS sin compilar todo
git add . && git commit -m "mensaje" && git push
```

No hay test suite configurado.

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
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── DropZone.tsx
│   │   │   └── SearchableSelect.tsx
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

> **Pendiente de seguridad:** timeout de sesión automático y límite de intentos de login.

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
- `row.height` y `row.commit()` no aplican alturas correctamente en este proyecto (bug conocido)

---

## Problemas Conocidos

| Problema | Estado |
|----------|--------|
| `row.height` en ExcelJS no aplica — todas las filas quedan en h=1 | Pendiente |
| Distribución por Combustible solo muestra 2 de 4 tipos | Pendiente |
| 238 tarjetas en seed en lugar de 235 (3 extras) | Pendiente |
| 20 tarjetas con patente válida tenían `allowedFuel="ambos"` incorrectamente | Corregidas en seed.ts (pendiente reset-dev) |
| `/api/auth/me` devuelve usuario hardcodeado — sin validación backend real | ✅ Resuelto |

---

## Inactividad de Tarjetas

### Cómo funciona hoy
- El parámetro `card_inactivity_days` (configurable en `/superadmin` → tab Sistema, default: 30 días) define el umbral de inactividad.
- Se usa **exclusivamente** en `GET /api/cards/export`: genera un Excel con dos sheets:
  - **Sheet 1 "Tarjetas Activas"**: tarjetas con al menos una carga (`status: 'IMPORTED'`) dentro de los últimos `card_inactivity_days` días.
  - **Sheet 2 "Tarjetas Inactivas"**: tarjetas sin cargas en ese período, con columna "Inactiva desde".
- El botón "Exportar Tarjetas" en `/cards` dispara ese endpoint.

### Lo que NO hace (pendiente de mejora)
- La tabla de `/cards` no muestra badge ni filtro de activa/inactiva — solo se detecta al exportar.
- El dashboard no usa este parámetro.
- El sistema de alertas no notifica tarjetas inactivas.

### Mejoras pendientes acordadas
- Cambiar el default de `card_inactivity_days` de 30 a **15 días** (más acorde a la operativa real).
- Agregar badge o indicador visual de "Inactiva" directamente en la tabla de `/cards`, sin necesidad de exportar.

---

## Pendientes (orden de prioridad)

1. **Resumen Ejecutivo mensual** — popup selector de mes al hacer click en el botón (agrupar facturas del mes seleccionado)
2. **Fix KPIs Resumen Ejecutivo** — alturas de fila (h=1) y distribución por combustible (solo 2 de 4 tipos)
3. **Dashboard** — reemplazar cuadrado azul "gasto del mes" por total de la última factura importada
4. **Inactividad de tarjetas** — cambiar default a 15 días + badge visual en tabla de `/cards`
5. **Seguridad (pendiente)** — timeout de sesión automático, límite de intentos de login
6. **Dominio propio**

---

## Tarjetas Pendientes de Corrección (allowedFuel)
Las 20 tarjetas con `allowedFuel="ambos"` incorrectamente asignado fueron corregidas en seed.ts.
**Pendiente:** ejecutar `npm run reset-dev` para aplicar los cambios.

Valores asignados:
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