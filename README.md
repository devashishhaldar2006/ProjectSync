# ProjectSync | Real-Time Agency Workspace & Live Project Intelligence

> **Velozity Global Solutions Technical Hiring Assessment Submission**  
> Role: Full Stack Developer  
> System: Real-Time Client Project Dashboard with Role-Based Access & Live Activity Feed

---

## 🚀 Live Demo & Submission Details
- **Assessment Submission Form**: [Submitted via Official Portal](https://bit.ly/4bGXmZV)
- **Tech Stack**: React 18, TypeScript, Node.js, Express, PostgreSQL, Prisma ORM, Socket.io, node-cron
- **Default Portals**:
  - Frontend: `http://localhost:5173`
  - Backend API: `http://localhost:5000`
  - PostgreSQL Database: `localhost:5432`

---

## 🏛 Architectural Decisions & Justifications

### 1. Backend Framework Choice: Node.js with Express & TypeScript
- **Rationale**: Express was chosen over Fastify because:
  - **Maturity & Middleware Chaining**: Express's middleware execution model provides rock-solid, sequential chaining of authentication, RBAC authorization, and Zod input validation (`authenticate -> requireRole -> validateBody`).
  - **First-Class Socket.io Integration**: Attaching Socket.io to the underlying Node HTTP server in Express allows unified session validation and shared connection state without ecosystem friction.
  - **TypeScript Type Merging**: Express easily extends the native `Request` object with `req.user: AuthenticatedUser`, ensuring strict compile-time type safety throughout all controllers.

### 2. WebSocket Library Choice: Socket.io
- **Rationale**: While native `ws` provides a minimalist WebSocket implementation, **Socket.io** provides production-critical features essential for multi-tenant, real-time collaboration:
  - **Room-based multiplexing (`socket.join('project:xyz')`, `socket.join('role:admin')`, `socket.join('user:123')`)**: Ensures that events are dispatched *strictly to authorized consumers*. A developer never receives socket messages about projects or tasks they do not own over the wire.
  - **JWT Handshake Authentication**: Handshake middleware validates the bearer token before connection upgrade, ensuring unauthorized sockets are rejected at the TCP boundary.
  - **Presence State Synchronization**: Accurately tracks unique active users across connections and gracefully handles reconnects.
  - **Automatic Fallback & Heartbeat Reconnection**: Seamlessly reconnects on transient packet drops and triggers a client-side database catch-up fetch (`GET /api/activities?limit=20`) to prevent dropped-state drift.

### 2. Job Queue / Scheduler Choice: node-cron
- **Rationale**: For the overdue task scheduler, **node-cron** was selected over Bull / BullMQ:
  - **Self-Contained Deployment Footprint**: Bull requires an external Redis dependency. `node-cron` runs in-process with zero extra operational overhead, executing every 60 seconds.
  - **Relational Consistency**: Performs atomic database queries using Prisma (`dueDate < NOW() AND status != 'DONE' AND isOverdue = false`).
  - **Event Orchestration**: Automatically records the overdue transition in the Postgres `ActivityLog` table, dispatches in-app notifications to the assigned Developer and Project Manager, and emits real-time WebSocket events.

### 3. Token Storage & Security Approach
- **Access Token**: Short-lived (15 minutes), signed with `JWT_ACCESS_SECRET`. Stored in memory / transmitted in the `Authorization: Bearer <token>` header.
- **Refresh Token**: Long-lived (7 days), stored inside an **`HttpOnly; SameSite=Lax; Path=/api/auth`** cookie.
  - Inaccessible to client-side JavaScript, rendering cross-site scripting (XSS) token exfiltration attacks impossible.
  - **Token Rotation & Revocation**: Upon refresh (`POST /api/auth/refresh`), the old token is invalidated in the `RefreshToken` database table and a newly hashed replacement is issued. Logging out revokes the session on the server.

### 4. Database Schema, Relationships & Indexing Strategy
The PostgreSQL database was modeled via Prisma ORM with strict relational constraints:
- **Foreign Keys**: Cascading deletes on dependent child records (`Client -> Project -> Task -> ActivityLog / Notification`), and `SetNull` on developer assignment so unassigning a developer does not destroy the task entity.
- **Indexes**:
  - `tasks (projectId, assignedToId, status, dueDate, isOverdue)`: Optimizes high-throughput dashboard filtering by status, priority, and date range.
  - `activity_logs (projectId, createdAt DESC)` and `activity_logs (userId, createdAt DESC)`: Provides instant response times for the role-filtered 20-event catchup query.
  - `notifications (userId, isRead, createdAt DESC)`: Accelerates unread badge counts and notification popover rendering.
  - `projects (managerId, clientId)`: Enforces rapid lookups during PM-scoped queries.

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│    Client    │1───────*│   Project    │1───────*│     Task     │
└──────────────┘         └──────────────┘         └──────────────┘
                                │                        │
                                │1                       │1
                                │*                       │*
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│     User     │1───────*│ ActivityLog  │*───────1│ Notification │
└──────────────┘         └──────────────┘         └──────────────┘
       │1
       │*
┌──────────────┐
│ RefreshToken │
└──────────────┘
```

---

## 🔒 Role-Based Access Control (RBAC) Enforcement Matrix

| Feature / Resource | Admin | Project Manager (PM) | Developer |
| :--- | :---: | :---: | :---: |
| **All Projects Oversight** | ✅ Global access | ❌ Own projects only | ❌ Projects with assigned tasks only |
| **Create / Update Projects** | ✅ Yes | ✅ Yes (assigned as PM) | ❌ 403 Forbidden |
| **Create / Edit Task Details** | ✅ Yes | ✅ Yes (in managed projects) | ❌ 403 Forbidden |
| **Update Task Status** | ✅ Yes | ✅ Yes | ✅ Yes (assigned tasks only) |
| **Activity Feed Visibility** | Global (all events) | Scoped to their projects | Scoped to their assigned tasks |
| **Dashboard Intelligence** | Global stats + live users | Project metrics + week deadlines | Assigned task queue + priority sort |
| **Missed Events Catch-up** | Last 20 global | Last 20 in their projects | Last 20 on assigned tasks |

> **Critical Security Guarantee**: Role middleware is enforced on **every protected endpoint at the API layer**. If a Developer tries to hit `PATCH /api/projects/:id` or `GET /api/projects/:other_pm_project`, the server intercepts and throws `403 Forbidden` regardless of client state.

---

## 📦 Local Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended, tested on v22)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)

### 1. Clone & Start PostgreSQL
```bash
# Clone the repository
git clone <repo-url>
cd ProjectSync

# Start PostgreSQL 16 container
docker compose up -d postgres
```

### 2. Configure & Run Backend Server
```bash
cd server
npm install

# Push database schema & seed initial test data
npx prisma db push
npm run seed

# Start server in development mode
npm run dev
```
The server will start on `http://localhost:5000`.

### 3. Run Frontend Client
```bash
cd ../client
npm install
npm run dev
```
The application will open on `http://localhost:5173`.

---

## 👥 Seed Credentials (Preloaded in Database)

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@velozity.com` | `Password123!` | Arthur Pendelton (Full system access, live presence) |
| **Project Manager** | `pm.sarah@velozity.com` | `Password123!` | Sarah Connor (FinTech & HealthCare projects) |
| **Project Manager** | `pm.marcus@velozity.com` | `Password123!` | Marcus Vance (Cloud Migration project) |
| **Developer** | `dev.ravi@velozity.com` | `Password123!` | Ravi Kumar (Assigned to tasks #1, #3, #8, #15) |
| **Developer** | `dev.elena@velozity.com` | `Password123!` | Elena Rostova (Assigned to tasks #2 [overdue], #6, #10, #14) |
| **Developer** | `dev.alex@velozity.com` | `Password123!` | Alex Chen (Assigned to tasks #4, #7 [overdue], #11, #13 [overdue]) |
| **Developer** | `dev.priya@velozity.com` | `Password123!` | Priya Patel (Assigned to tasks #5, #9, #12, #16) |

*(Note: The UI includes a one-click Quick Role Switcher button bar at the top of the sidebar to test all 3 perspectives immediately).*

---

## 📝 Assessment Explanation (150–250 Words)

> **The hardest problem you solved, how you handled the real-time role-filtered feed, and one thing you'd do differently:**

The most challenging engineering decision in ProjectSync was designing a leak-proof, real-time activity feed that maintains strict multi-tenant boundaries both **in-flight over WebSockets** and **at-rest during missed-event catchup**. 

Rather than naively broadcasting events to a single channel and filtering on the client, we architected a two-tiered security model. Over the wire, we leveraged Socket.io room multiplexing (`role:admin`, `project:{id}`, and `user:{id}`). When a task status changes, the server verifies project ownership and dispatches notifications exclusively to the project manager and the assigned developer's isolated rooms, preventing unauthorized packet inspection. For offline catchup, we implemented a role-constrained PostgreSQL query indexed on `(projectId, createdAt DESC)` and `(userId, createdAt DESC)`. When an offline user reconnects, the database evaluates their verified JWT identity to return the last 20 relevant events: Admins receive global activity, PMs receive their managed projects' stream, and Developers receive updates solely for their assigned tasks.

If doing this differently in production with hundreds of thousands of concurrent users, I would decouple the WebSocket state using Redis Pub/Sub adapters (`@socket.io/redis-adapter`) to enable horizontal multi-node scaling across server clusters, and offload the node-cron scheduler to a distributed job runner like BullMQ backed by Redis for idempotent cluster execution and distributed lock guarantees.

---

## ⚠️ Known Limitations
1. In high-traffic multi-server topologies, an in-process memory map for WebSocket presence would need Redis Streams or Redis Sets to track cluster-wide presence accurately.
2. Rate limiting (e.g. `express-rate-limit`) is recommended before deploying to public production endpoints to guard against brute-force authentication attempts.
