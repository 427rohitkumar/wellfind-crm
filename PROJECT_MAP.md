# Wellfind CRM (Wellfind Academic Dashboard) — Codebase Architecture & Project Map

> **Notice for AI Coding Agents:**  
> This file is the primary architectural map for `wellfind-crm`. Read this file first before scanning the repository. It contains verified module responsibilities, routing tables, service contracts, and navigation rules. Modify application source code only after identifying the exact feature-to-file relationships documented below.

---

## 1. Project Overview

**Wellfind Academic Dashboard** (`wellfind-crm`) is a high-performance, single-page administrative and teacher management web application built with **React 19** and **Vite**.

Originally adapted from the **Meridian React Dashboard** design system, the application has been customized into the primary portal for **Wellfind Academic**, an academic tutoring and teacher placement platform. The dashboard manages:
- **Authentication & RBAC:** Multi-role access for `super_admin` and `teacher` users.
- **Inquiries Management:** Two-way portal for processing parent/student tuition enquiries and teacher job applications, with live audit logs, status pipelines, and private KYC document access.
- **Students Management:** Directory of converted active students, tracking classes, assigned tutors, tuition timings, and enrollment statuses.
- **Teachers Management:** Directory of tutor profiles, verification stages (KYC), registration fee payments, and student allocations.
- **Reporting & Analytics:** Sparklines, sales, revenue, and traffic analytics via ApexCharts.
- **Settings & Profile:** Theme customization (light/dark mode), account security, password updates, and profile management.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime / Build Tool** | Vite | `^8.3.5` | Fast ESM development server, HMR, and production bundler |
| **Language & Format** | JavaScript (ES Modules) | ES2022+ | Modern JS (`type: "module"`) |
| **Frontend Framework** | React / ReactDOM | `^19.3.1` | Component UI rendering, hooks, and Concurrent React |
| **Routing** | React Router DOM | `^7.18.5` | Client-side routing, protected routes, nested layouts, redirects |
| **Styling & CSS** | Tailwind CSS v4 / Custom OKLCH | `@tailwindcss 4.x` | Modern token-based CSS variables, dark-mode styling, responsive grid |
| **CSS Utilities** | `clsx`, `tailwind-merge` | `^2.1.1`, `^3.7.0` | Conditional class name resolution and Tailwind conflict resolution |
| **Icon Library** | Lucide React | `^1.62.0` | Standardized iconography across navigation, actions, and status badges |
| **Data Visualization** | ApexCharts / React-ApexCharts | `^8.5.0`, `^2.1.1` | Dashboard metrics, sparklines, area and bar graphs |
| **Code Quality / Linter**| ESLint | `^10.13.0` | Flat ESLint config (`eslint.config.js`) with React Hooks & Refresh plugins |
| **Backend Integration** | Payload CMS / REST API | External (`:3005`)| REST endpoints for auth, enquiries, audit logs, and private documents |

---

## 3. Repository Root Structure

```text
wellfind-crm/
├── dist/                     # Generated production build artifacts (Vite output, gitignored)
├── node_modules/             # Installed npm dependencies (gitignored)
├── public/                   # Static assets served as-is (e.g. blue-logo-wellfind.png)
├── src/                      # Application source code
│   ├── assets/               # Local static images and SVGs
│   ├── components/           # Reusable UI library, layout shells, and auth guards
│   ├── context/              # React Context state providers (Auth, Theme, AppShell, Badges)
│   ├── hooks/                # Custom hooks (e.g. useAuth)
│   ├── pages/                # Route-level page components and feature modules
│   ├── services/             # Central API client and domain-specific REST services
│   ├── utils/                # Utility helpers (reserved directory)
│   ├── App.css               # Top-level application styling overrides
│   ├── App.jsx               # Main routing tree and RBAC boundary declarations
│   ├── index.css             # Design tokens, theme variables, and component stylesheets
│   └── main.jsx              # Application bootstrapping & root context mounting
├── .env                      # Local environment configuration (gitignored)
├── .env.example              # Template environment variables (VITE_API_BASE_URL)
├── .gitignore                # Git ignore rules
├── AGENTS.md                 # Agent execution guidelines
├── eslint.config.js          # ESLint flat configuration
├── index.html                # HTML entry point containing #root
├── package.json              # Project metadata, scripts, and dependency manifest
├── package-lock.json         # Pinned dependency lockfile
├── PROJECT_MAP.md            # Comprehensive repository architecture documentation (this file)
├── README.md                 # Project starter documentation
└── vite.config.js            # Vite configuration, aliases (@ -> src), and dev proxy rules
```

---

## 4. Applications and Packages

- **`wellfind-crm`** is a standalone, single-package frontend web application.
- There are no monorepo workspaces, Lerna packages, or internal sub-packages.
- Backend logic, database schemas, and Payload CMS models reside in an independent external repository (`wellfind-api`) connected over HTTP REST.

---

## 5. Frontend Architecture

### 5.1 Application Entry & Mounting Pipeline
1. **`index.html`** declares `#root` and loads `/src/main.jsx`.
2. **`src/main.jsx`** wraps the application in the following provider hierarchy:
   - `<StrictMode>`
   - `<BrowserRouter>`: Initializes React Router v7.
   - `<ThemeProvider>`: Manages light/dark mode and sets `color-scheme` on `document.documentElement`.
   - `<AppShellProvider>`: Handles responsive sidebar state, mobile viewports, and hamburger menus.
   - `<AuthProvider>`: Loads JWT token and authenticated user from `localStorage`, binds `auth:unauthorized` event bus.
   - `<App>`: Evaluates route match against declared route table.

### 5.2 Layout Architecture (`src/components/layout/`)
- **`Layout.jsx`**: The primary authenticated shell. Wraps content with:
  - `<EnquiryCountProvider>`: Automatically computes and distributes unread inquiry badge counts.
  - `<Sidebar>`: Collapsible navigation with active route highlights, badges, and submenus.
  - `<Navbar>`: Fixed top header with search trigger, theme toggle (sun/moon), notification icons, and the top-right profile dropdown.
  - `<main className="main">`: Renders nested `<Outlet />` pages with standard Meridian container padding.
- **`ErrorLayout`** (in `Layout.jsx`): Minimal centered layout for HTTP error pages (`403`, `404`, `500`).

### 5.3 Global State & Context Providers (`src/context/`)
- **`AuthContext.jsx`** (Consumer hook: `src/hooks/useAuth.js`):
  - State: `token`, `user` (id, email, role, avatar), `isLoading`.
  - Methods: `login(email, password)`, `logout()`.
  - Storage: Synced with `localStorage` keys `wellfind_admin_token` and `wellfind_admin_user`.
  - Event Bus: Listens for `auth:unauthorized` dispatched by `apiClient.js` on 401 responses to automatically clear credentials.
- **`ThemeContext.jsx`**:
  - State: `theme` (`'light'` or `'dark'`).
  - Methods: `toggleTheme()`, `setTheme(theme)`.
  - Side Effect: Synchronizes `.dark` CSS class and `document.documentElement.style.colorScheme`.
- **`AppShellContext.jsx`**:
  - State: `isSidebarCollapsed` (desktop collapse), `isSidebarVisible` (mobile drawer toggle), `isMobile`.
  - Methods: `toggleSidebar()`, `toggleMobileSidebar()`, `collapseSidebar()`, `expandSidebar()`.
- **`EnquiryCountContext.jsx`**:
  - State: `studentCount`, `teacherCount`, `combinedTotal`, `loading`, `error`.
  - Methods: `refreshCounts()`.
  - Polling: Reads unread inquiry totals via lightweight `page=1&limit=1` metadata queries.

---

## 6. Pages, Routes, and UI Component Mapping

All application routes are defined in [`src/App.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/App.jsx):

```text
/                                -> Login.jsx (Public default)
├── /login                       -> Redirect to /
├── /forgot-password             -> ForgotPassword.jsx (Public)
│
├── [Super Admin Protected - allowedRoles: ['super_admin']]
│   └── /admin                   -> Dashboard.jsx (Overview & metrics)
│   └── /inquiries               -> Inquiries.jsx (Dual-tab inquiries portal)
│   └── /orders                  -> Redirect to /inquiries (Legacy alias)
│   └── /students                -> Students.jsx (Active converted students directory)
│   └── /students/new            -> Redirect to /students
│   └── /products                -> Redirect to /students (Legacy alias)
│   └── /teachers                -> Teachers.jsx (Teacher directory & KYC)
│   └── /customers               -> Redirect to /teachers (Legacy alias)
│   └── /reports                 -> Reports.jsx (Sales, traffic, revenue charts)
│   └── /settings                -> Settings.jsx (System & account settings)
│   └── /profile                 -> Profile.jsx (Admin profile & activity)
│   └── /blank                   -> Blank.jsx (Empty workspace scaffold)
│
├── [Teacher Protected - allowedRoles: ['teacher']]
│   └── /teacher                 -> TeacherDashboard.jsx (Teacher Portal)
│   └── /teacher/profile         -> Profile.jsx (Teacher profile)
│   └── /teacher/settings        -> Settings.jsx (Teacher settings)
│
└── [Error Layout]
    ├── /403                     -> Error403.jsx (Forbidden)
    ├── /404                     -> Error404.jsx (Not Found)
    ├── /500                     -> Error500.jsx (Server Error)
    └── /*                       -> Redirect to /404
```

### 6.1 Route to File Details Table

| Route | Role Access | Entry Page Component | Sub-components & Modals | Associated Services |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Public | [`src/pages/auth/Login.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/pages/auth/Login.jsx) | `Input`, `Button`, `Alert` | `apiClient.js` (`loginAdmin`) |
| `/forgot-password` | Public | [`src/pages/auth/ForgotPassword.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/pages/auth/ForgotPassword.jsx) | `Input`, `Button` | `apiClient.js` |
| `/admin` | `super_admin` | [`src/pages/dashboard/Dashboard.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/pages/dashboard/Dashboard.jsx) | `Chart.jsx`, `Stat.jsx`, `Card.jsx` | — |
| `/teacher` | `teacher` | [`src/pages/teacher/TeacherDashboard.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/pages/teacher/TeacherDashboard.jsx) | `Card.jsx`, `Badge.jsx` | `useAuth.js` |
| `/inquiries` | `super_admin` | [`src/pages/inquiries/Inquiries.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/pages/inquiries/Inquiries.jsx) | `StudentInquiriesTab.jsx`<br>`TeacherInquiriesTab.jsx`<br>`InquiryDetailModal.jsx`<br>`InquiryEditModal.jsx`<br>`InquiryDeleteModal.jsx`<br>`StudentEnquiryDetail.jsx` | `studentEnquiryService.js`<br>`teacherEnquiryService.js`<br>`enquiryAuditService.js`<br>`apiClient.js` |
| `/students` | `super_admin` | [`src/pages/students/Students.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/pages/students/Students.jsx) | `StudentDetailModal.jsx`<br>`StudentEditModal.jsx`<br>`StudentDeleteModal.jsx`<br>`StudentAddModal.jsx`<br>`StudentStatusBadge.jsx`<br>`DismissibleAlert.jsx` | `studentService.js`<br>`apiClient.js` |
| `/teachers` | `super_admin` | [`src/pages/teachers/Teachers.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/pages/teachers/Teachers.jsx) | `TeacherDetailModal.jsx`<br>`TeacherEditModal.jsx`<br>`TeacherStatusBadge.jsx`<br>`DismissibleAlert.jsx` | `teachersSampleData.js` |
| `/reports` | `super_admin` | [`src/pages/reports/Reports.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/pages/reports/Reports.jsx) | `Chart.jsx`, `Stat.jsx` | — |
| `/settings` | `super_admin`, `teacher` | [`src/pages/settings/Settings.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/pages/settings/Settings.jsx) | `Dialog.jsx`, `Toggle.jsx`, `Input.jsx` | `useAuth.js` |
| `/profile` | `super_admin`, `teacher` | [`src/pages/profile/Profile.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/pages/profile/Profile.jsx) | `Avatar.jsx`, `Card.jsx` | `useAuth.js` |

---

## 7. Backend Architecture & Integration Points

The frontend communicates with a **Payload CMS** backend (`wellfind-api`) running at `http://localhost:3005`.

### 7.1 Reverse Proxy & Base URL Handling (`vite.config.js` & `apiClient.js`)
- In development (`import.meta.env.DEV`), API calls to `/api/*` are routed through the Vite proxy (`vite.config.js`) to `http://localhost:3005`. This completely prevents browser CORS issues.
- In production, `VITE_API_BASE_URL` is loaded from environment variables and stripped of trailing slashes.
- Every outgoing request automatically attaches the Bearer JWT token from `localStorage` under `Authorization: Bearer <token>`.
- If an API returns HTTP `401 Unauthorized`, `apiClient.js` clears session keys and dispatches a global `auth:unauthorized` event to force-redirect the user to login.

### 7.2 Backend REST Collections
| Payload CMS Collection | REST Endpoint | Supported Methods | Description |
| :--- | :--- | :--- | :--- |
| `users` | `/api/auth/login`<br>`/api/auth/logout`<br>`/api/auth/me` | `POST`<br>`POST`<br>`GET` | Authentication, user credentials, and role verification (`super_admin` vs `teacher`) |
| `student-enquiries` | `/api/student-enquiries` | `GET`, `POST`, `PATCH`, `DELETE` | Parent inquiries for student home/online tuition, statuses: `new`, `contacted`, `in_progress`, `converted`, `closed` |
| `teacher-enquiries` | `/api/teacher-enquiries` | `GET`, `POST`, `PATCH`, `DELETE` | Teacher recruitment submissions, statuses: `new`, `under_review`, `shortlisted`, `approved`, `rejected` |
| `enquiry-audit-log` | `/api/enquiry-audit-log` | `GET` | Audit trail history recording who updated statuses, when, and internal admin notes |
| Private Media | Private Document URL | `GET` (Bearer JWT) | Secured Aadhaar identity cards and qualification degree certificates |

---

## 8. API Endpoint and Service Mapping

All HTTP network interactions are consolidated inside [`src/services/`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/services/):

### 8.1 `apiClient.js`
- **`apiRequest(endpoint, options)`**: Core wrapper around `fetch()`. Attaches headers (`Accept: application/json`, `Content-Type: application/json`, `Authorization: Bearer <jwt>`). Normalizes error bodies.
- **`loginAdmin(email, password)`**: Posts credentials to `/api/auth/login`, saves JWT and user object to `localStorage`.
- **`logoutAdmin()`**: Posts to `/api/auth/logout` and purges `localStorage`.
- **`getCurrentUser()`**: Calls `/api/auth/me` to refresh authenticated user identity.
- **`fetchPrivateDocumentBlob(pathOrUrl)`**: Downloads protected teacher KYC files using the admin JWT.

### 8.2 `studentEnquiryService.js`
- **`fetchStudentEnquiries({ page, limit, sort, status, search })`**: Queries `/api/student-enquiries` with Payload CMS `where` filters.
- **`getStudentEnquiryById(id)`**: Fetches a single enquiry document by ID.
- **`updateStudentEnquiry(id, data)`**: Performs `PATCH /api/student-enquiries/:id` (updates `enquiryStatus`, `adminNotes`, `assignedTo`).
- **`deleteStudentEnquiry(id)`**: Calls `DELETE /api/student-enquiries/:id`.

### 8.3 `teacherEnquiryService.js`
- **`fetchTeacherEnquiries({ page, limit, sort, status, search })`**: Queries `/api/teacher-enquiries` with Payload CMS `where` filters.
- **`getTeacherEnquiryById(id)`**: Fetches a single teacher application document with relationship references (`aadhaarDocument`, `qualificationDocument`).
- **`updateTeacherEnquiry(id, data)`**: Performs `PATCH /api/teacher-enquiries/:id` (updates `applicationStatus`, `adminNotes`, `reviewedBy`, `reviewedAt`).
- **`deleteTeacherEnquiry(id)`**: Calls `DELETE /api/teacher-enquiries/:id`.
- **`downloadTeacherDocument(docReference)`**: Streams private KYC media into a local Blob URL for in-browser download.

### 8.4 `studentService.js`
- **`fetchStudents({ page, limit, sort, status, studentClass, search })`**: Connects to `/api/student-enquiries` with `where[enquiryStatus][equals]=converted`. Seamlessly falls back to structured in-memory session data if the backend is unreachable.
- **`createStudent(newStudentData)`**, **`updateStudent(id, fields)`**, **`deleteStudent(id)`**: Manages active student records.

### 8.5 `enquiryAuditService.js`
- **`fetchEnquiryAuditLog({ enquiryType, enquiryId })`**: Retrieves chronologically sorted audit log entries from `/api/enquiry-audit-log` for either a student enquiry or teacher enquiry.

---

## 9. Database and Data Model Mapping

### 9.1 Data Entity Schemas

#### Student Enquiry Model (`src/services/studentEnquiryService.js`)
```javascript
{
  id: string | number,
  name: string,
  phoneNumber: string,
  email: string,
  studentClass: string,
  subjects: string[] | string,
  locality: string,
  preferredTiming: string,
  budgetRange: string,
  enquiryStatus: 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed',
  adminNotes: string,
  assignedTo: string,
  createdAt: string,
  updatedAt: string
}
```

#### Teacher Enquiry Model (`src/services/teacherEnquiryService.js`)
```javascript
{
  id: string | number,
  fullName: string,
  mobileNumber: string,
  email: string,
  primarySubject: string,
  teachingLocality: string,
  highestQualification: string,
  experienceYears: number,
  classLevels: string,
  availability: string,
  applicationStatus: 'new' | 'under_review' | 'shortlisted' | 'approved' | 'rejected',
  adminNotes: string,
  aadhaarDocument: { url: string, filename: string },
  qualificationDocument: { url: string, filename: string },
  reviewedBy: string,
  reviewedAt: string,
  createdAt: string,
  updatedAt: string
}
```

#### Converted Student Record (`src/pages/students/studentsSampleData.js`)
```javascript
{
  id: string,                 // e.g. "STD-001"
  name: string,               // Student Name
  parentName: string,         // Parent / Guardian Name
  phone: string,              // Primary Mobile
  email: string,              // Contact Email
  studentClass: string,       // e.g. "Class 10 (ICSE)"
  subjects: string[],         // e.g. ["Mathematics", "Physics"]
  locality: string,           // Locality / Area
  preferredTiming: string,    // e.g. "Weekday Evenings"
  budgetRange: string,        // e.g. "₹5,000 – ₹7,000 / month"
  status: 'active' | 'enrolled' | 'in_progress' | 'paused' | 'completed',
  assignedTeacher: string,    // Assigned Tutor Name
  submittedDate: string       // ISO Date / Formatted String
}
```

#### Managed Teacher Record (`src/pages/teachers/teachersSampleData.js`)
```javascript
{
  id: string,                 // e.g. "TCH-001"
  name: string,
  email: string,
  mobile: string,
  avatar: string | null,
  primarySubject: string,
  qualification: string,
  experienceYears: number,
  classLevels: string,
  locality: string,
  availability: string,
  registrationFee: {
    status: 'paid' | 'pending' | 'failed' | 'waived',
    amount: number,
    currency: 'INR',
    year: string,
    paymentDate: string
  },
  kyc: {
    status: 'verified' | 'under_review' | 'pending' | 'rejected',
    aadhaarStatus: string,
    qualificationStatus: string,
    reviewNotes: string,
    reviewedAt: string
  },
  studentAllocation: {
    status: 'allocated' | 'partially_allocated' | 'unallocated',
    allocatedCount: number,
    studentsSummary: string,
    students: Array<{ id: string, name: string, studentClass: string }>
  },
  account: {
    status: 'active' | 'inactive' | 'suspended'
  }
}
```

---

## 10. Authentication and Authorization

### 10.1 Role-Based Access Control (RBAC) Matrix
The application implements strict client-side role guards via [`ProtectedRoute.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/auth/ProtectedRoute.jsx):

| Feature / Page | `super_admin` | `teacher` | Unauthenticated |
| :--- | :---: | :---: | :---: |
| **Login (`/`)** | Redirects to `/admin` | Redirects to `/teacher` | Accessible |
| **Admin Dashboard (`/admin`)** | Full Access | 403 / Redirects to `/teacher` | Redirects to `/` |
| **Inquiries (`/inquiries`)** | Full Access (CRUD & Audit) | Access Denied | Redirects to `/` |
| **Students Directory (`/students`)** | Full Access (CRUD & CSV) | Access Denied | Redirects to `/` |
| **Teachers Directory (`/teachers`)** | Full Access (KYC, Fee, Status) | Access Denied | Redirects to `/` |
| **Teacher Portal (`/teacher`)** | Redirects to `/admin` | Full Access (Schedule, Batches)| Redirects to `/` |
| **Reports (`/reports`)** | Full Access | Access Denied | Redirects to `/` |
| **Settings / Profile** | Admin View (`/settings`) | Teacher View (`/teacher/settings`)| Redirects to `/` |

### 10.2 Top-Right Admin Profile Dropdown
Located in [`src/components/layout/Navbar.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/layout/Navbar.jsx):
- **User Trigger:** Displays user initials avatar, display name, chevron, and theme toggle.
- **Dropdown Identity:** Exclusively displays the dynamic user **email** (`user?.email`) and role pill badge (`Super Admin` or `Teacher`).
- **Actions:** Links to Profile, Settings, and a red-styled **Log out** button.
- **Dismissal:** Automatically closes on outside clicks or pressing `Escape`.

---

## 11. Shared Components and UI Library (`src/components/ui/`)

All shared primitives are exported through [`src/components/ui/index.js`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/index.js):

| Component | File | Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **`Avatar`** | [`Avatar.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Avatar.jsx) | Image avatar with automatic error fallback to initials, circle/square radii, sizes `sm`, `md`, `lg`, `xl`. |
| **`Badge`** | [`Badge.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Badge.jsx) | Status pill badges supporting `primary`, `success`, `warning`, `danger`, `info`, and `neutral`. |
| **`Button`** | [`Button.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Button.jsx) | Button with variants (`primary`, `neutral`, `danger`, `ghost`, `outline`, `soft`), size options, loading spinner. |
| **`Card`** | [`Card.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Card.jsx) | Card container with compound sub-components: `CardHeader`, `CardBody`, `CardFooter`. |
| **`Chart`** | [`Chart.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Chart.jsx) | Reusable ApexCharts wrapper handling themes, tooltips, responsive rendering. |
| **`Dialog`** | [`Dialog.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Dialog.jsx) | Accessible modal system (`DialogContent`, `DialogHeader`, `DialogBody`, `DialogFooter`, `DialogClose`). |
| **`DismissibleAlert`** | [`DismissibleAlert.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/DismissibleAlert.jsx) | Reusable notification banner (`info`, `success`, `warning`, `error`). Dismissible via close button (X), layout-stable. |
| **`Input`** | [`Input.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Input.jsx) | Form inputs, floating labels, input group addons, textarea, and select dropdowns. |
| **`Menu`** | [`Menu.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Menu.jsx) | Popover menu lists and action dropdowns. |
| **`Popover`** | [`Popover.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Popover.jsx) | Floating trigger-based popover panel. |
| **`Stat`** | [`Stat.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Stat.jsx) | KPI metric card with trend percentage indicator. |
| **`Table`** | [`Table.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Table.jsx) | **Smart Horizontal Scroll Table**: Automatically clamps >6 columns, provides mouse-wheel/drag scrolling, sticky right Actions column, and `useTableSelection` selection hook. |
| **`Toggle`** | [`Toggle.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Toggle.jsx) | Accessible switch toggle control. |

---

## 12. Background Jobs, Queues, and Integrations

- **Client-Side Polling / Counts:** `EnquiryCountContext.jsx` runs lightweight polling on inquiry counts to keep sidebar notification badges synchronized.
- **Audit Logging Integration:** Status transitions on enquiries in `Inquiries.jsx` generate audit records via `enquiryAuditService.js`.
- **Event Bus:** `window.addEventListener('auth:unauthorized', ...)` in `AuthContext.jsx` triggers session invalidation whenever a 401 response occurs.
- **No Background Workers:** As a pure client SPA, `wellfind-crm` runs no Node.js background workers, Redis queues, or cron daemons.

---

## 13. Infrastructure and Deployment

- **Development Server:**
  - `npm run dev`: Starts Vite dev server on port `5173` (or next available).
  - Proxy configuration in `vite.config.js` routes all `/api` traffic to `VITE_API_BASE_URL` (default: `http://localhost:3005`).
- **Production Build:**
  - `npm run build`: Executes `vite build` to output compiled HTML, CSS, and JS chunks into `dist/`.
  - Minification: Uses Rollup/Oxc with chunk optimization.
- **Static Web Server Deployment:**
  - The `dist/` directory can be deployed to Nginx, Apache, Vercel, Netlify, AWS S3/CloudFront, or Firebase Hosting.
  - Requires standard SPA fallback rule: all non-file route requests must serve `index.html`.

---

## 14. Testing and Verification

- **Linting:**
  ```bash
  npm run lint
  ```
  Runs ESLint across all `.js` and `.jsx` files using the configuration in `eslint.config.js`.
- **Production Compilation Verification:**
  ```bash
  npm run build
  ```
  Verifies that all JSX syntax, CSS parsing, imports, and Rollup chunking succeed with zero errors.
- **Preview Production Build:**
  ```bash
  npm run preview
  ```
  Spins up a local web server to test the generated `dist/` production assets.

---

## 15. Configuration File Locations

| File | Path | Key Responsibility |
| :--- | :--- | :--- |
| **Vite Config** | [`vite.config.js`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/vite.config.js) | React plugin, `@` path alias resolution, `/api` proxy definition. |
| **ESLint Config** | [`eslint.config.js`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/eslint.config.js) | Flat config rules for React 19, React Hooks, and browser globals. |
| **Package Manifest**| [`package.json`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/package.json) | Dependencies, build scripts, project metadata (`wellfind-crm`). |
| **Env Example** | [`.env.example`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/.env.example) | Declares required environment variable `VITE_API_BASE_URL`. |
| **HTML Template** | [`index.html`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/index.html) | Root HTML document mounting `/src/main.jsx`. |
| **Design Tokens** | [`src/index.css`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/index.css) | Core color palette (OKLCH), dark mode overrides, custom scrollbars, alert styles. |

---

## 16. Feature-to-File Navigation Index

| Feature / Domain | Primary Page File | Key Child Components | Service File | Sample Data / Config |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Login** | `src/pages/auth/Login.jsx` | `src/components/auth/ProtectedRoute.jsx` | `src/services/apiClient.js` | `src/context/AuthContext.jsx` |
| **Password Reset** | `src/pages/auth/ForgotPassword.jsx` | `Input.jsx`, `Button.jsx` | `src/services/apiClient.js` | — |
| **Admin Overview Dashboard** | `src/pages/dashboard/Dashboard.jsx`| `src/components/ui/Chart.jsx` | — | — |
| **Teacher Portal Dashboard** | `src/pages/teacher/TeacherDashboard.jsx` | `Card.jsx`, `Badge.jsx` | `useAuth.js` | — |
| **Student Enquiries Pipeline** | `src/pages/inquiries/Inquiries.jsx` | `StudentInquiriesTab.jsx`<br>`InquiryDetailModal.jsx`<br>`InquiryEditModal.jsx`<br>`InquiryDeleteModal.jsx` | `src/services/studentEnquiryService.js`<br>`src/services/enquiryAuditService.js` | `STUDENT_ENQUIRY_STATUSES` in service |
| **Teacher Enquiries Pipeline** | `src/pages/inquiries/Inquiries.jsx` | `TeacherInquiriesTab.jsx`<br>`InquiryDetailModal.jsx`<br>`InquiryEditModal.jsx`<br>`InquiryDeleteModal.jsx` | `src/services/teacherEnquiryService.js`<br>`src/services/enquiryAuditService.js` | `TEACHER_APPLICATION_STATUSES` in service |
| **Active Students Directory** | `src/pages/students/Students.jsx` | `StudentDetailModal.jsx`<br>`StudentEditModal.jsx`<br>`StudentDeleteModal.jsx`<br>`StudentAddModal.jsx`<br>`StudentStatusBadge.jsx` | `src/services/studentService.js` | `src/pages/students/studentsSampleData.js` |
| **Teachers & KYC Directory** | `src/pages/teachers/Teachers.jsx` | `TeacherDetailModal.jsx`<br>`TeacherEditModal.jsx`<br>`TeacherStatusBadge.jsx` | — | `src/pages/teachers/teachersSampleData.js` |
| **Data Reports & Analytics** | `src/pages/reports/Reports.jsx` | `Chart.jsx`, `Stat.jsx` | — | — |
| **Admin & Teacher Settings** | `src/pages/settings/Settings.jsx` | `Dialog.jsx`, `Toggle.jsx`, `Input.jsx`| `useAuth.js` | — |
| **User Profile & Activity** | `src/pages/profile/Profile.jsx` | `Avatar.jsx`, `Card.jsx` | `useAuth.js` | — |
| **Top Navigation & Profile** | `src/components/layout/Navbar.jsx` | Profile Dropdown, Theme Toggle | `src/context/ThemeContext.jsx` | — |
| **Collapsible Sidebar Nav** | `src/components/layout/Sidebar.jsx`| NavLink Items, Unread Badges | `src/context/EnquiryCountContext.jsx` | — |

---

## 17. Important Architectural Relationships

1. **Separation of Enquiries vs. Converted Records:**
   - `Inquiries.jsx` manages incoming leads (`/api/student-enquiries` and `/api/teacher-enquiries`). When leads are vetted or approved:
   - Converted student enquiries feed into the active student roster in `Students.jsx`.
   - Approved teacher applicants transition into managed teacher profiles in `Teachers.jsx`.
2. **Centralized Data Access (`apiClient.js`):**
   - All domain services (`studentEnquiryService.js`, `teacherEnquiryService.js`, `studentService.js`, `enquiryAuditService.js`) import `apiRequest` from `apiClient.js`.
   - Never write raw `fetch()` calls inside React UI components. Always add new endpoints to the corresponding service module.
3. **Smart Horizontal Scroll Table Pattern:**
   - Reusable across all data grids via [`src/components/ui/Table.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/Table.jsx).
   - If a table has more than 6 columns, it automatically exposes horizontal trackpad and mouse drag scrolling with sticky right action buttons.
4. **Status Alert Handling:**
   - Both `Teachers.jsx` and `Students.jsx` utilize [`DismissibleAlert.jsx`](file:///D:/Dev-2026/Projects/dashboard-template/wellfind-crm/src/components/ui/DismissibleAlert.jsx).
   - Alerts are initialized to `null` so page refresh remains clean.
   - Banners trigger dynamically upon real user operations (sync, update, save, delete, export).

---

## 18. Code Navigation Rules for Future Agents

Future AI coding agents working on this codebase **MUST** follow these rules:

1. **Read `PROJECT_MAP.md` First:** Before searching or reading files for a task, check Section 6 (Routes) and Section 16 (Feature Navigation Index) to locate the exact source files.
2. **Inspect Only Relevant Files:** Do not run broad filesystem searches across `node_modules`, `dist`, or unrelated pages. Inspect only the feature files and their direct dependencies.
3. **No Code Modification During Discovery:** When instructed to inspect or map, never edit application files or run package installations.
4. **Reuse the Existing Service Layer:** When integrating backend endpoints, add functions to `src/services/` using `apiRequest` rather than creating redundant fetch implementations.
5. **Preserve UI Component Consistency:** Always reuse primitives from `src/components/ui/` (`Button`, `Badge`, `Card`, `Table`, `DismissibleAlert`, `Dialog`, `Input`) to maintain the Meridian visual design system.
6. **Role Guard Awareness:** Remember that `/admin` and `/teacher` portals have distinct allowed roles in `src/App.jsx`. Ensure new routes are placed inside the proper `ProtectedRoute` boundary.
7. **Perform Targeted Verification:** Run `npx eslint <modified-file>` first. Run full builds only when requested or when verifying complete pull requests.
8. **Keep `PROJECT_MAP.md` Updated:** When introducing new routes, feature modules, or services, update this document to keep the project map accurate.

