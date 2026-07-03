# JP-WALLET — Especificación del Proyecto

**Versión**: 0.6.0 (Adjuntos + Configuración + Panel de Resultados + reorganización de changes)
**Estado**: En Revisión
**Última actualización**: 2026-06-21

---

## 1. Visión General

**Nombre del Proyecto**: JP-WALLET
**Tipo**: Aplicación Web de Finanzas Personales

**Visión Central**: Una aplicación de finanzas personales que combina registro de gastos, gestión de presupuestos y control de cuentas. Los usuarios registran sus transacciones de forma manual y visualizan reportes para entender sus hábitos financieros.

**Usuarios Objetivo**: Usuario individual que gestiona sus finanzas personales. A futuro, soporte para grupos compartidos (gastos divididos).

---

## 2. Stack Tecnológico

| Capa | Tecnología | Razón |
|------|-----------|-------|
| **Framework** | Vite + React 19 + TypeScript 6 | Rendimiento, ecosistema, tipado fuerte |
| **Package Manager** | Bun | Velocidad, runtime moderno |
| **Linter/Formatter** | Biome | Herramienta unificada DX |
| **Backend** | Convex (cloud) | Tiempo real, TypeScript end-to-end, serverless |
| **Auth** | Google OAuth 2.0 | Single sign-on, simple, requiere conexión en primer login |
| **Estado UI** | Zustand | Liviano, mínimo boilerplate |
| **Estado Servidor** | TanStack Query | Caching automático, revalidación, optimistas |
| **Ruteo** | React Router v6/v7 | Simple, suficiente para ~10 pantallas |
| **Notificaciones** | Diferido a v2 | Web Push cuando se necesite |
| **Offline** | Diferido a v2 | No crítico en VPS con conexión permanente |
| **Despliegue** | Docker Compose + Caddy (VPS) | Reproducible, auto-HTTPS con Let's Encrypt |

---

## 3. Principios de Diseño UX/UI

### 3.1 Enfoque Mobile-First Web
- Diseñado pensando en mobile pero adaptable a desktop
- Navegación tipo bottom navigation en mobile, sidebar en desktop
- Formularios grandes optimizados para teclado táctil

### 3.2 Utilidad Ante Todo
- Cada elemento sirve un propósito funcional
- Acciones rápidas en ≤2 clics
- Jerarquía de información: lo importante es lo más visible

### 3.3 JP-DS (Sistema de Diseño)
- Design tokens en CSS custom properties (colores, tipografía, espaciado)
- Modo oscuro/claro desde el inicio
- Componentes base en `packages/jp-ds`
- Portátil a futuros proyectos
- **Fuente de verdad visual:** [`desing.md`](/desing.md) (raíz del repo)

### 3.4 Pantallas Core

```
├── Login / Registro
│   └── Email + password
├── Dashboard (Home)
│   ├── Resumen de balance total
│   ├── Transacciones recientes
│   └── Acciones rápidas (+ gasto, + ingreso)
├── Transacciones
│   ├── Lista filtrable por fecha, categoría, cuenta
│   ├── Búsqueda
│   └── CRUD completo
├── Cuentas
│   ├── Lista de cuentas (efectivo, banco, crédito)
│   ├── Balance por cuenta
│   └── Transferencias entre cuentas
├── Categorías
│   ├── Lista con iconos y colores
│   ├── Crear/Editar categorías
│   └── Estadísticas por categoría
├── Presupuestos
│   ├── Presupuestos activos con barras de progreso
│   ├── Configuración de alertas
│   └── Crear presupuesto mensual
├── Reportes
│   ├── Resumen mensual (ingresos vs gastos)
│   ├── Desglose por categoría (gráficos)
│   └── Exportar (PDF/CSV)
├── Grupos (Futuro)
│   ├── Lista de grupos
│   └── Gastos compartidos
└── Configuración
    ├── Perfil de usuario
    ├── Preferencias (tema, moneda)
    └── Estado de sincronización
```

---

## 4. Funcionalidades Core

### 4.1 Autenticación con Google

| Capacidad | Descripción |
|-----------|-------------|
| Inicio de sesión | Botón "Continuar con Google" → flujo OAuth 2.0 |
| Cuenta nueva | Primer login crea `user` automáticamente con categorías por defecto |
| Cierre de sesión | Limpia sesión local, redirect a landing |
| Re-autenticación | Si expira la sesión, vuelve a pedir Google OAuth |

**Nota**: requiere conexión a internet para autenticar. Sin conexión no se puede iniciar sesión por primera vez.

### 4.2 Gestión de Cuentas

| Capacidad | Descripción |
|-----------|-------------|
| Múltiples cuentas | Efectivo, Banco, Tarjeta de Crédito |
| Balance en tiempo real | Saldo actual por cuenta |
| Transferencias | Movimiento de fondos entre cuentas |

### 4.3 Motor de Transacciones

| Capacidad | Descripción |
|-----------|-------------|
| Registrar ingreso | Monto, fecha, categoría, notas |
| Registrar gasto | Misma metadata |
| Transferencias | Internas entre cuentas |
| Editar/Eliminar | CRUD completo |
| Buscar y filtrar | Por fecha, categoría, cuenta, rango de monto |
| Transacciones recurrentes | Automatizadas via Convex scheduled functions |
| **Adjuntos** | **Imágenes y PDFs por transacción (recibos, facturas, extractos)** |
| **Agrupación temporal** | **Vista por semana, mes, trimestre o semestre (configurable)** |

### 4.4 Sistema de Categorías

| Capacidad | Descripción |
|-----------|-------------|
| Categorías personalizadas | Nombre, icono, color |
| Tipos | Ingreso, Gasto, Transferencia |
| Categorías por defecto | Semilla inicial (ver 4.4.1) |

#### 4.4.1 Categorías por Defecto

**Gastos:**
| Nombre | Icono | Color |
|--------|-------|-------|
| Comida | 🍔 | #FF6B6B |
| Transporte | 🚗 | #4ECDC4 |
| Entretenimiento | 🎬 | #9B59B6 |
| Compras | 🛒 | #F39C12 |
| Salud | 💊 | #E74C3C |
| Hogar | 🏠 | #3498DB |
| Servicios | 📄 | #95A5A6 |
| Otros Gastos | 📦 | #7F8C8D |

**Ingresos:**
| Nombre | Icono | Color |
|--------|-------|-------|
| Salario | 💰 | #27AE60 |
| Freelance | 💻 | #2ECC71 |
| Inversiones | 📈 | #16A085 |
| Otros Ingresos | 💵 | #1ABC9C |

**Transferencias:**
| Nombre | Icono | Color |
|--------|-------|-------|
| Transferencia | 🔄 | #34495E |

### 4.5 Presupuestos y Alertas

| Capacidad | Descripción |
|-----------|-------------|
| Crear presupuesto | Límite mensual por categoría |
| Progreso visual | Barras de progreso |
| Umbrales de alerta | Notificar al 50%, 80%, 100% |
| Exceso de gasto | Alerta en tiempo real |

### 4.6 Panel de Resultados y Gráficos

| Capacidad | Descripción |
|-----------|-------------|
| Resumen mensual | Comparativa ingresos vs gastos |
| Desglose por categoría | Gráficos de torta/barras |
| Tendencia | Comparación mes a mes, trimestre a trimestre |
| Gráficos visuales | Barras, líneas, tortas, áreas, combinados |
| Filtros | Por rango de fechas, categoría, cuenta, período |
| Exportar | PDF y CSV |

### 4.7 Gastos Compartidos (Futuro)

| Capacidad | Descripción |
|-----------|-------------|
| Crear grupos | Invitar miembros |
| Gastos grupales | Registrar quién pagó y quién debe |
| Cálculo de balances | Saldo pendiente por miembro |
| Liquidación | Marcar deudas como saldadas |

### 4.8 Sincronización Cloud

| Capacidad | Descripción |
|-----------|-------------|
| Tiempo real | Convex reactive database |
| Multi-dispositivo | Acceso desde varios dispositivos |
| Backup | Backup automático de datos |

### 4.9 Declaración de Renta (DIAN Colombia)

| Capacidad | Descripción |
|-----------|-------------|
| Perfiles anuales | Una declaración por año gravable |
| Secciones DIAN | Patrimonio, Deudas, Ingresos, Deducciones, Rentas exentas |
| Ingresos | Salarios, cesantías, intereses, dividendos, honorarios, otros |
| Deducciones | Salud, educación, vivienda, dependientes, intereses de vivienda |
| Patrimonio | Bienes inmuebles, vehículos, inversiones, cuentas bancarias |
| **Adjuntos** | **Imágenes y PDFs por rubro (certificaciones, facturas, extractos)** |
| Auto-poblar | Trae datos desde `transactions` y `accounts` cuando aplica |
| Exportar | PDF / CSV / JSON listo para revisión o presentación |

### 4.10 Créditos y Préstamos

| Capacidad | Descripción |
|-----------|-------------|
| Registrar crédito | Nombre, entidad, monto original, tasa de interés, plazo, fecha inicio |
| Calendario de pagos | Genera tabla de amortización (cuotas mensuales) |
| Historial de pagos | Registra cada pago, linkea a `transactions` cuando se paga |
| Saldo pendiente | Balance en tiempo real por crédito |
| Alertas de vencimiento | Notificación X días antes del pago |
| Múltiples créditos | Varios créditos simultáneos (hipotecario, vehículo, personal) |

### 4.11 Configuración y Personalización

| Capacidad | Descripción |
|-----------|-------------|
| Tema | Claro / Oscuro / Sistema |
| Período de agrupación | Vista por defecto: semana, mes, trimestre o semestre |
| Gestión de categorías | Crear, editar, archivar categorías (interfaz dedicada) |
| Idioma | Español (default) |
| Notificaciones | Activar/desactivar alertas y recordatorios |
| Exportar datos | Descarga completa (PDF, CSV, JSON) |
| Eliminar cuenta | Borrar cuenta y todos los datos asociados |

---

## 5. Modelo de Datos

### 5.1 Formato de Moneda
**COP (Peso Colombiano):** `$ 1.234.567` (puntos como separador de miles)

### 5.2 Schema Convex

Tablas: `users`, `accounts`, `transactions`, `categories`, `budgets`, `splitGroups`, `splitExpenses`, `taxDocuments`, `taxItems`, `taxImages`, `credits`, `creditPayments`, `attachments`, `userPreferences`

### 5.3 Transacciones Recurrentes

```typescript
interface RecurringConfig {
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
  startDate: timestamp;
  endDate?: timestamp;
  nextTriggerDate: timestamp;
  lastTriggerDate?: timestamp;
  autoCreate: boolean;
}
```

### 5.4 Declaración de Renta

```typescript
interface TaxDocument {
  id: string;
  userId: string;
  taxYear: number; // año gravable (ej: 2025)
  status: "draft" | "review" | "filed";
  totalIncome: number;
  totalDeductions: number;
  totalAssets: number;
  totalLiabilities: number;
  taxableIncome: number;
  taxDue: number;
  createdAt: timestamp;
  filedAt?: timestamp;
}

interface TaxItem {
  id: string;
  documentId: string; // → TaxDocument
  section: "income" | "deductions" | "assets" | "liabilities" | "exempt";
  category: string; // ej: "salarios", "salud_prepagada", "vivienda"
  description: string;
  amount: number;
  imageIds: string[]; // → TaxImage
  notes?: string;
  createdAt: timestamp;
}

interface TaxImage {
  id: string;
  itemId: string; // → TaxItem
  storageId: string; // Convex file storage
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: timestamp;
}
```

### 5.5 Créditos y Préstamos

```typescript
interface Credit {
  id: string;
  userId: string;
  name: string; // ej: "Crédito Hipotecario Bancolombia"
  lender: string;
  principal: number;
  interestRate: number; // anual, ej: 12.5
  termMonths: number;
  startDate: timestamp;
  paymentDay: number; // día del mes (1-31)
  outstandingBalance: number;
  status: "active" | "paid_off" | "defaulted";
  notes?: string;
  createdAt: timestamp;
}

interface CreditPayment {
  id: string;
  creditId: string; // → Credit
  installmentNumber: number;
  dueDate: timestamp;
  paidDate?: timestamp;
  amount: number;
  principal: number;
  interest: number;
  status: "pending" | "paid" | "overdue";
  transactionId?: string; // → Transaction
}
```

### 5.6 Adjuntos

```typescript
interface Attachment {
  id: string;
  userId: string;
  entityType: "transaction" | "taxItem" | "creditPayment";
  entityId: string;
  storageId: string; // Convex file storage
  filename: string;
  mimeType: string; // image/jpeg, image/png, application/pdf
  size: number; // bytes
  uploadedAt: timestamp;
}
```

### 5.7 Preferencias de Usuario

```typescript
interface UserPreferences {
  id: string;
  userId: string;
  theme: "light" | "dark" | "system";
  defaultGrouping: "week" | "month" | "quarter" | "semester";
  language: "es" | "en";
  notificationsEnabled: boolean;
  updatedAt: timestamp;
}
```

---

## 6. Arquitectura de Despliegue

```
VPS (Hostinger)
├── Caddy (reverse proxy, auto-HTTPS)
│   ├── wallet.tudominio.com → frontend (Nginx)
│   └── api.tudominio.com → backend (Convex cloud)
├── Docker Compose
│   ├── frontend (Nginx sirviendo build estático de Vite)
│   └── caddy (TLS automático)
└── Convex cloud (backend serverless, no en VPS)
```

---

## 7. Seguridad

| Aspecto | Enfoque |
|---------|---------|
| Identidad | Google OAuth (ID token validado server-side en Convex) |
| Sesión | JWT firmado tras validar token de Google |
| API Tokens | No aplica (no hay API externa por ahora) |
| Datos en tránsito | HTTPS vía Caddy |
| Datos en reposo | Convex maneja encriptación |

### 7.1 Flujo de Auth (Google OAuth)

```
App → Inicio
├── ¿Sesión activa?
│   ├── SÍ → Dashboard
│   └── NO → Pantalla con botón "Continuar con Google"
├── Click Google → popup OAuth de Google
├── Usuario autoriza → Google devuelve ID token
├── Convex action valida token contra Google
├── ¿Usuario nuevo?
│   ├── SÍ → crea `user` + categorías por defecto
│   └── NO → carga perfil existente
└── Sesión persistida → Dashboard
```

---

## 8. Sistema de Diseño (JP-DS)

JP-WALLET incluirá un **sistema de diseño reutilizable (JP-DS)** como paquete separado.

**Documento maestro (visual e interacción):** [`desing.md`](/desing.md) — tokens, temas, componentes, motion, accesibilidad e identidad *Green Bolt*. Consultar siempre antes de implementar o diseñar UI.

### Principios
- **Zero dependencia de lógica de negocio** — componentes UI puros
- **Tokens auto-contenidos** — colores, tipografía, espaciado en una sola fuente
- **Themeable** — modo oscuro/claro desde el inicio
- **Accesible** — WCAG 2.1 AA mínimo

### Estructura
```
packages/jp-ds/
├── tokens/
│   ├── color.css
│   ├── typography.css
│   ├── spacing.css
│   └── dark.css (overrides modo oscuro)
├── components/    # Componentes base UI
└── patterns/      # Patrones compuestos (card, list-item, etc.)
```

---

## 9. Pendientes y Decisiones

- [x] Moneda → **COP (Peso Colombiano)**
- [x] Transacciones recurrentes → **Sí**
- [x] Modo offline → **Diferido a v2**
- [x] Formatos de exportación → **PDF, CSV**
- [x] Integración con IA → **No por ahora**
- [x] Autenticación biométrica → **No, ahora Google OAuth**
- [x] Despliegue → **VPS Hostinger con Docker Compose + Caddy**
- [x] Voz/STT → **No por ahora**
- [x] Login → **Google OAuth (requiere conexión)**
- [x] Declaración de Renta → **Sí, organizada por secciones DIAN con imágenes y PDFs**
- [x] Créditos y préstamos → **Sí, sección personalizada**
- [x] Adjuntos en transacciones → **Sí, imágenes y PDFs**
- [x] Agrupación temporal configurable → **Sí, semana / mes / trimestre / semestre**
- [x] Panel de configuración → **Sí, centralizado (tema, agrupación, categorías, idioma, notificaciones)**
- [x] Panel de Resultados con gráficas → **Sí, gráficos visuales de ingresos/gastos/categorías**

---

## 10. Próximos Pasos

1. ✅ SPEC v0.6.0 con Google Auth + Declaración de Renta + Créditos + Adjuntos + Configuración + Panel de Resultados
2. ✅ **Change 1: web-foundation** (completado 2026-06-24, en `testing`)
   - Google OAuth popup end-to-end (`@convex-dev/auth`)
   - App shell, ruteo, JP-DS, tema (lógica completa; UI toggle diferida)
3. ✅ **Change 2: web-core** (completado 2026-07-03, en `testing`)
   - CRUD cuentas, categorías y transacciones + transferencias
   - Adjuntos por transacción (imágenes y PDFs)
   - Dashboard real con balance, resumen mensual y recientes
   - UI responsive mobile-first alineada a `webcore.pen`
3b. **Change 2b: web-deploy** (en revisión — ver `changes/web-deploy/`)
   - Producción en `wallet.lavalex.co` (VPS Nginx + Convex Cloud prod)
   - CI/CD: GitHub Actions al push a `main`
4. **Change 3: Configuración completa**
   - Panel: tema, agrupación temporal (semana/mes/trimestre/semestre), gestión de categorías, idioma, notificaciones
5. **Change 4: Presupuestos + Reportes + Panel de Resultados**
   - Límites por categoría con alertas
   - Gráficos visuales (barras, tortas, líneas, tendencias) con filtros
6. **Change 5: Declaración de Renta (DIAN)**
   - Items por sección DIAN
   - Adjuntos (imágenes y PDFs) por rubro
   - Exportación para presentación
7. **Change 6: Créditos y Préstamos**
   - Calendario de amortización
   - Tracking de pagos y saldo

---

*Este spec se refinará a medida que avancemos con los ciclos SDD.*
