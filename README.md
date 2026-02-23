# HOH108 - House of Hancet 108

CRM and Interior Design Platform with Admin Dashboard, Customer Portal, and Public Website.

**Stack**: React 19 + Vite (Frontend) | Node.js + Express (Backend) | MongoDB Atlas (Database)
**Domain**: https://hoh108.com
**Server**: 88.222.215.4 (Nginx + PM2)

---

## Changelog

### Bug Fix Session - January 31, 2026

17 bugs fixed across backend and frontend. Changes deployed to production.

---

#### Backend Changes

**1. `backend/routes/leads.js` - Company Code Mapping Fix (Critical)**
- Changed company mapping from `'HOH108': 'HG'` to `'HOH108': 'HOH'` to match the actual database company code
- Added fallback logic: if company not found by code, falls back to any active company
- Added null guard: returns user-friendly error instead of 500 if no company exists
- Added error handling around auto-assignment so lead creation succeeds even if round-robin assignment fails

**2. `backend/models/Lead.js` - Lead Workflow Method Fixes**
- Fixed `markAsRNR()` method: corrected parameter signature, added null guards for RNR tracking
- Fixed `markAsLost()` method: corrected parameter order (reason, userId, userName)
- Fixed `markAsFutureProspect()` method: corrected parameter order (followUpDate, reason, userId, userName)
- Fixed `assignToAllDepartments()` method: updated to accept assignment object structure instead of flat parameters

**3. `backend/models/Company.js` - ID Generation Fix**
- Enhanced `generateId()` with database sequence synchronization on first call
- Added collision detection with retry logic (up to 10 retries)
- Syncs sequence counter with highest existing record in the database to prevent duplicate IDs

**4. `backend/routes/tickets.js` - Ticket Route Fixes**
- Added null guard for missing company context in `/categories` endpoint (returns empty array instead of crashing)
- Added request logging middleware for debugging ticket route issues
- Enhanced error logging with user and company context

**5. `backend/routes/employees.js` - Department Filtering Fix**
- Changed department filtering from exact string match to case-insensitive regex match
- Fixes employee lookup failures when department name casing doesn't match exactly

---

#### Frontend Changes

**6. `src/admin/pages/leads/LeadsList.jsx` & `LeadDetail.jsx` - Lead Management Fixes**
- Fixed Promise handling using `Promise.allSettled()` for parallel API calls
- Added fulfillment status checks before using API response data
- Enhanced error recovery in lead loading and status transitions

**7. `src/admin/context/AuthContext.jsx` & `CompanyContext.jsx` - State Management Fixes**
- Fixed React state initialization for auth and company contexts
- Added null checks for undefined user/company data
- Fixed lifecycle issues in useEffect hooks

**8. `src/admin/components/ui/*` - UI Component Updates**
- Enhanced form validation for lead creation and updates
- Improved error message display and recovery flows
- Added guards for undefined data in UI components

---

#### Production Deployment

- Frontend: Built with `npm run build`, served from `/var/www/html/` via Nginx
- Backend: Files uploaded via SFTP to `/var/www/backend/`, managed by PM2
- After uploading backend files, PM2 must be restarted:
  ```bash
  source /root/.nvm/nvm.sh && pm2 restart all
  ```

---

## Project Structure

```
HOH108-NEW/
├── src/                    # Frontend (React + Vite)
│   ├── admin/              # Admin dashboard
│   │   ├── pages/          # Admin pages (leads, customers, projects, HR, finance)
│   │   ├── components/     # Admin UI components
│   │   └── context/        # Auth & Company context providers
│   ├── pages/              # Public website pages
│   ├── components/         # Public website components
│   └── assets/             # Images and static assets
├── backend/                # Backend (Node.js + Express)
│   ├── routes/             # API route handlers
│   ├── models/             # Mongoose models
│   ├── middleware/          # Auth, RBAC, rate limiting
│   ├── utils/              # Helpers (notifications, round-robin, phone masking)
│   ├── scripts/            # Database scripts
│   ├── seeders/            # Seed data
│   └── server.js           # Express app entry point
├── dist/                   # Production frontend build output
└── package.json            # Frontend dependencies
```

## Companies

| Code | Name                 | Type   |
|------|----------------------|--------|
| HOH  | House of Hancet 108  | Mother |
| IP   | Interior Plus        | -      |

## Key API Endpoints

| Endpoint            | Description                          |
|---------------------|--------------------------------------|
| `POST /api/leads`   | Create lead from website form        |
| `POST /api/auth/*`  | Authentication (login/register)      |
| `GET /api/dashboard` | Dashboard analytics                 |
| `/api/leads/*`      | Lead CRUD and workflow               |
| `/api/customers/*`  | Customer management                  |
| `/api/projects/*`   | Project management                   |
| `/api/employees/*`  | Employee management                  |
| `/api/tickets/*`    | Support ticket system                |
| `/api/companies/*`  | Multi-company management             |
