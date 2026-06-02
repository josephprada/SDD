# JP-WALLET — Project Specification

**Version**: 0.3.0 (In Review — Updated)
**Status**: In Review
**Last Updated**: 2026-05-29

---

## 1. Overview

**Project Name**: JP-WALLET
**Type**: Mobile Financial Management Application

**Core Vision**: A personal finance app that combines expense tracking, budget management, and group expense splitting with an AI-first interface. Users interact primarily through natural language (text or voice) — telling the app what they spent, asking about their finances, and managing categories through conversation.

**Target Users**: Individual users managing personal finances, with future potential for shared household or group expense scenarios.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-------------|------------|
| **Mobile Framework** | React Native (Expo) | Sideloading for personal APK install |
| **Package Manager** | Bun | Faster installs, modern runtime |
| **Linter/Formatter** | Biome | Unified DX tooling |
| **Navigation** | React Navigation v6 | Bottom tabs + stack nested navigation |
| **State Management** | Zustand | Lightweight, minimal boilerplate |
| **Backend** | Convex (convex.dev) | Real-time TypeScript backend, scheduled functions |
| **Auth** | Device Biometric + PIN fallback | FaceID/TouchID primary, PIN secondary, email recovery |
| **LLM Integration** | MiniMax M2.7 API | Configurable, swappable provider |
| **Speech-to-Text** | @react-native-community/speech | Native speech recognition |
| **Notifications** | Expo Notifications | Budget alerts and reminders |
| **Storage** | Convex (cloud) + Secure Device Storage | Token vault + data persistence |

---

## 3. UI/UX Design Principles

### 3.1 Natural Feel
- **Organic Interactions**: Gestures feel tactile, transitions are smooth and purposeful
- **Breathing Space**: Generous whitespace, no cluttered screens
- **Progressive Disclosure**: Simple by default, deep on demand

### 3.2 Supremacy of Utility
- Every element serves a functional purpose — no decorative UI
- Quick actions accessible in ≤2 taps
- Information hierarchy: what matters most is most visible

### 3.3 Core Screens

```
├── Login Screen
│   └── Biometric authentication
├── Home Dashboard
│   ├── Balance overview (total, by account)
│   ├── Recent transactions
│   ├── Quick action buttons (+ expense, + income)
│   └── AI Chat toggle
├── Transactions List
│   ├── Filterable by date, category, account
│   ├── Search
│   └── Swipe actions (edit, delete)
├── AI Chat Interface
│   ├── Message history
│   ├── Voice input button
│   ├── Text input
│   └── Transaction preview confirmation
├── Categories Management
│   ├── List view with icons/colors
│   ├── Create/Edit via AI Chat
│   └── Category stats
├── Budgets
│   ├── Active budgets with progress bars
│   ├── Alerts configuration
│   └── Budget creation
├── Reports & Charts
│   ├── Monthly overview charts
│   ├── Category breakdowns
│   ├── Trend analysis
│   └── Export options
├── Split Groups
│   ├── Group list
│   ├── Group detail (members, expenses, balances)
│   └── Create/join group
└── Settings
    ├── Account management
    ├── LLM configuration
    ├── Sync status
    └── Theme preferences
```

---

## 4. Core Features

### 4.1 Authentication & Vault

| Capability | Description |
|------------|-------------|
| Biometric Login | FaceID/TouchID authentication on app launch |
| Secure Token Storage | Encrypted storage for API tokens and sensitive data |
| Session Management | Auto-logout after inactivity, secure token refresh |

### 4.2 Account Management

| Capability | Description |
|------------|-------------|
| Multi-Account Support | Cash, Bank, Credit Card accounts |
| Balance Tracking | Real-time balance per account |
| Transfers | Move funds between accounts |

### 4.3 Transaction Engine

| Capability | Description |
|------------|-------------|
| Record Income | Add income with amount, date, category, notes |
| Record Expense | Add expense with same metadata |
| Transfer Funds | Internal transfers between accounts |
| Edit/Delete | Full CRUD on transactions |
| Search & Filter | By date range, category, account, amount range |
| Recurring Transactions | Convex scheduled functions evaluate and auto-create pending transactions |
| Receipt Photos | **Deferred** — not in initial scope, but AI chat CAN read images via vision when attached |

### 4.4 Category System

| Capability | Description |
|------------|-------------|
| Custom Categories | User-created categories with name, icon, color |
| Category Types | Income, Expense, Transfer |
| Predefined Seed | App starts with common categories (see 4.4.1) |
| AI Category Creation | Create categories via natural language chat |

#### 4.4.1 Default Categories (Seed)

**Expense Categories:**
| Name | Icon | Color |
|------|------|-------|
| Comida | 🍔 | #FF6B6B |
| Transporte | 🚗 | #4ECDC4 |
| Entretenimiento | 🎬 | #9B59B6 |
| Compras | 🛒 | #F39C12 |
| Salud | 💊 | #E74C3C |
| Hogar | 🏠 | #3498DB |
| Servicios | 📄 | #95A5A6 |
| Otros Gastos | 📦 | #7F8C8D |

**Income Categories:**
| Name | Icon | Color |
|------|------|-------|
| Salario | 💰 | #27AE60 |
| Freelance | 💻 | #2ECC71 |
| Inversiones | 📈 | #16A085 |
| Regalos | 🎁 | #E91E63 |
| Otros Ingresos | 💵 | #1ABC9C |

**Transfer Categories:**
| Name | Icon | Color |
|------|------|-------|
| Transferencia | 🔄 | #34495E |

### 4.5 AI Chat Interface

| Capability | Description |
|------------|-------------|
| Conversational Finance | Ask questions: "How much did I spend on food this month?" |
| Voice Input | Transcribe voice to text for transaction entry |
| Natural Transaction Entry | "Spent 50 dollars on pizza yesterday" → parsed and created |
| Recommendations | AI suggests budgets, categorizations, savings tips |
| Category Management | "Create a category called Travel with blue color" |

### 4.6 AI Auto-Categorization

| Capability | Description |
|------------|-------------|
| Text Analysis | LLM extracts amount, date, category, notes from natural text |
| Voice Parsing | Audio → text → structured transaction |
| Confidence Flow | High confidence → auto-create; Low confidence → user confirm |

### 4.7 Budgets & Alerts

| Capability | Description |
|------------|-------------|
| Budget Creation | Set monthly limits per category |
| Progress Tracking | Visual progress bars |
| Alert Thresholds | Notify at 50%, 80%, 100% of budget |
| Overspend Alerts | Real-time notifications via Expo Notifications |

### 4.8 Reports & Charts

| Capability | Description |
|------------|-------------|
| Monthly Overview | Income vs Expense summary |
| Category Breakdown | Pie/bar charts by category |
| Trend Analysis | Month-over-month comparison |
| Export | PDF/CSV export of reports |

### 4.9 Split Expenses (Future)

| Capability | Description |
|------------|-------------|
| Create Groups | Invite members to shared group |
| Add Group Expenses | Track who paid and who owes |
| Balance Calculation | Per-member outstanding balance |
| Settlement | Mark debts as settled |

### 4.10 Cloud Sync

| Capability | Description |
|------------|-------------|
| Real-time Sync | Convex real-time database |
| Multi-Device | Access from multiple devices |
| Backup | Automatic data backup |

---

## 5. Data Model

### 5.1 Core Entities

```
User
├── id: string
├── email: string (optional, for account recovery)
├── pinHash: string (bcrypt hash of fallback PIN)
├── createdAt: timestamp
└── settings: JSON
```

**Currency Format (COP):** `1.234.567` (peso colombiano con puntos como separador de miles)

### 5.2 Convex Schema

Tables: `users`, `accounts`, `transactions`, `categories`, `budgets`, `splitGroups`, `splitExpenses`, `chatMessages`

### 5.3 Recurring Transactions

```typescript
interface RecurringConfig {
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "yearly";
  startDate: timestamp;
  endDate?: timestamp; // optional, infinite if omitted
  nextTriggerDate: timestamp;
  lastTriggerDate?: timestamp;
  autoCreate: boolean; // true = auto-create; false = prompt user
}
```

### 5.4 Sync Queue (Offline)

```typescript
interface SyncQueueItem {
  id: string;
  entityType: "transaction" | "account" | "category" | "budget";
  entityId: string;
  operation: "create" | "update" | "delete";
  payload: JSON;
  createdAt: timestamp;
  retryCount: number;
}
```

---

## 6. AI Integration

### 6.1 LLM Provider (Configurable)

```typescript
interface LLMConfig {
  provider: "minimax" | "openai" | "anthropic" | "ollama";
  apiKey: string;
  model: string;
  baseUrl?: string;
}
```

**Initial**: MiniMax M2.7 with MiniMax API token

### 6.2 Prompt Engineering

| Intent | System Prompt Guidance |
|--------|----------------------|
| Transaction Creation | Extract: amount, type (income/expense), category, date, notes |
| Category Creation | Extract: name, type, icon preference, color preference |
| Finance Query | Answer based on user's transaction history |
| Recommendations | Personalized based on spending patterns |

### 6.3 Voice Pipeline

```
User speaks → Speech-to-Text (@react-native-community/speech) → LLM Parsing → Transaction Confirmation → Convex Write
```

### 6.4 Image Handling in AI Chat

The AI Chat interface CAN receive and process images:
- User attaches image from gallery or camera
- Image is sent to LLM with vision capability (if supported by provider)
- LLM extracts transaction data from image (receipt parsing in future)
- For now: images are described/analyzed, no automatic transaction creation

**Note**: Receipt photo attachment to transactions is deferred to future scope.

---

## 7. Security

| Concern | Approach |
|---------|----------|
| API Tokens | Encrypted in device keychain, never in plaintext |
| Biometric Auth | Native device APIs (LocalAuthentication) — primary method |
| PIN Fallback | Mandatory PIN setup after biometric enrollment |
| Account Recovery | Email-based recovery link (optional email field) |
| Data at Rest | Convex handles encryption in transit; device keychain for local secrets |
| Session | Auto-timeout after 5 min inactivity |

### 7.1 Auth Flow

```
App Launch
├── Biometric available?
│   ├── YES → Prompt biometric → Success → Home
│   └── NO → Prompt PIN → Success → Home
└── First launch / No PIN → PIN setup wizard
```

### 7.2 Account Recovery Flow

```
Login → Forgot PIN?
├── Enter registered email
├── Receive recovery link
├── Reset PIN
└── Login with new PIN
```

---

## 8. Open Questions

- [x] Currency support → **COP (Colombian Pesos)** — single currency
- [x] Recurring transactions support → **Yes**
- [x] Receipt photo attachment → **Yes** — gallery or camera, auto-processed by AI
- [x] Offline mode → **Priority** — local SQLite for viewing and creating records, sync on reconnect, AI chat unavailable offline
- [x] Export formats → **PDF, CSV, JSON** — full export support
- [x] AI/MCP Integration → **Yes** — external API for AI environments to connect

---

## 9. Design System (JP-DS)

JP-WALLET will establish a **reusable design system (JP-DS)** that can be ported to future projects.

### Principles
- **Zero dependency on business logic** — pure UI components
- **Self-contained tokens** — colors, typography, spacing in a single source
- **Themeable** — dark/light modes, future custom themes
- **Accessible** — WCAG 2.1 AA minimum

### Token Categories
```
jp-ds/
├── tokens/
│   ├── color/
│   ├── typography/
│   ├── spacing/
│   ├── motion/
│   └── elevation/
├── components/       # Base UI components
├── patterns/         # Composed patterns (card, list-item, etc.)
└── templates/       # Screen templates
```

### Portability
The design system will be published as a separate package (`jp-ds-react-native`) for reuse in:
- JP-WALLET (primary consumer)
- Future React Native projects
- Web variants (future)

---

## 10. Offline Architecture

### Local Storage Strategy
- **SQLite (expo-sqlite)** for local transaction cache
- **Sync Queue**: offline-created records queued for sync
- **Conflict Resolution**: last-write-wins with timestamp comparison

### Offline Capabilities
| Feature | Offline |
|---------|---------|
| View transactions | ✅ Full read access |
| Create transactions | ✅ Queued for sync |
| Edit/Delete transactions | ✅ Queued for sync |
| View accounts/balance | ✅ Cached |
| AI Chat | ❌ Requires connection |
| Voice input | ✅ Text captured, processed when online |

### Sync Flow
```
Online: Convex ←→ React Native (real-time)
Offline: SQLite ←→ Sync Queue → Convex (on reconnect)
```

---

## 11. External API / MCP

To support AI environment integration:

### Exposed Endpoints
```
POST /api/transactions    — Create transaction
GET  /api/transactions    — List transactions
GET  /api/balance         — Current balance
GET  /api/categories      — List categories
POST /api/categories      — Create category
GET  /api/chat            — Send chat message
GET  /api/reports         — Generate report
```

### Authentication
- API key-based auth for external clients
- Scoped permissions (read-only, read-write, admin)

---

## 12. Next Steps

1. ✅ Review and refine this SPEC.md (IN PROGRESS)
2. Start **Change 1: Auth + Vault Core**
   - Biometric login flow
   - Secure token storage (Keychain)
   - Convex user schema
   - Local SQLite setup for offline
3. Proceed to **Change 2: Account Management**
4. Continue with remaining changes
5. Extract JP-DS (design system) into separate package after Change 3

---

*This spec will be refined as we progress through SDD cycles.*