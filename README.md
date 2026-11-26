# FLOWSTATE — Voice-Driven Agentic Workflow Automation

> **Turning everyday business instructions into structured, executable workflows.**
> Built with Google Gemini, React, TypeScript, Tailwind CSS, Express, and Progressive Web App (PWA) architecture.

---

## 1. Executive Summary & Product Vision

**FLOWSTATE** is a voice-driven agentic workflow automation platform engineered for modern enterprise operations. Rather than forcing employees to navigate multiple disconnected SaaS dashboards, manually triage incident reports, or search through scattered SOPs, FLOWSTATE allows operators to describe goals in natural speech or text.

### How It Operates
1. **Understands Natural Voice & Text:** Real-time conversational interface powered by Google Gemini.
2. **Grounded RAG Intelligence:** Ingests enterprise runbooks, playbooks, and post-mortems (PDF, DOCX, TXT, MD) using semantic vector retrieval.
3. **Decomposes Complex Requests:** Synthesizes multi-step workflows with milestone tasks, priority levels, assignees, and dependencies.
4. **Human-in-the-Loop Governance:** Enforces approval gates before executing sensitive external actions (e.g. ticketing, customer emails, ERP payments).
5. **Multi-Tenant Workspace Isolation:** Supports both private Personal Workspaces and collaborative Organization Workspaces with role-based access control (RBAC).
6. **Cross-Platform Installability:** Full Progressive Web App (PWA) installable on Windows, macOS, Linux, Android, and iOS.

---

## 2. Key Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERACTION LAYER                        │
│  Gemini Live Voice STT/TTS • Web Speech API • Visual Wave  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   INTELLIGENCE LAYER (AI)                   │
│  Gemini Models (Flash/Pro) • Intent Parsing • Workflow Gen │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    KNOWLEDGE LAYER (RAG)                    │
│  Semantic Embeddings • PDF/DOCX Parser • Grounded Playbooks │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                 ORCHESTRATION & GOVERNANCE                  │
│  Task Router • Approval Gates • Multi-Tenant RBAC Security │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│              PERSISTENCE & INTEGRATION LAYER                │
│  Firebase Firestore • Multi-Tenant Store • Audit Trail Receipts│
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, Motion
- **Backend Server:** Node.js, Express, Vite Server Middleware, Multer, Mammoth (DOCX)
- **AI Engine:** Google Gen AI SDK (`@google/genai`) with Gemini 2.5 Flash, 2.0 Flash, 1.5 Flash fallbacks
- **Knowledge Retrieval:** Semantic chunking with vector cosine similarity and lexical token fallbacks
- **Database / Auth:** Firebase Authentication (RS256 ID tokens), Cloud Firestore, dual-layer persistent workspace store
- **Application Packaging:** Progressive Web App (PWA) with Web App Manifest, Service Worker caching, and standalone window display

---

## 4. Multi-Tenant Architecture & Roles

FLOWSTATE provides strict separation between tenant records:

### Workspace Types
- **Personal Workspace:** Designed for individuals and solo operators who need private task management, custom voice prompts, and isolated workflows.
- **Organization Workspace:** Designed for teams and departments. Supports shared playbooks, team workload visibility, approval queues, and cross-department task assignment.

### Role-Based Access Control (RBAC)
| Role | Workflows | Tasks | Knowledge Base | Approvals | Org Settings & Invites |
|---|---|---|---|---|---|
| **Owner** | Full (Create/Edit/Delete/Run) | Full | Full | Authorize & Reject | Full Control |
| **Admin** | Full (Create/Edit/Delete/Run) | Full | Full | Authorize & Reject | Manage Members & Settings |
| **Manager** | Create / Edit / Run | Assign & Update | Upload & View | Authorize & Reject | Invite Teammates |
| **Member** | Create / Edit / Run | Update Assigned | Upload & View | View Only | View Only |
| **Viewer** | Read-Only | Read-Only | Read-Only | View Only | View Only |

---

## 5. Getting Started & Local Development

### Prerequisites
- **Node.js:** v18.0.0 or higher (v24 LTS recommended)
- **npm:** v9.0.0 or higher
- **Gemini API Key:** (Optional for live Gemini calls; intelligent local synthesizer fallback included for offline/dev testing)

### Installation
```bash
# 1. Clone or navigate to the project directory
cd c:\Users\Lenovo\Documents\Flowstate

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional)
cp .env.example .env
```

### Environment Variables (`.env`)
```env
# Google Gemini API Key (stored strictly on backend, never exposed to browser)
GEMINI_API_KEY="your-gemini-api-key"

# Gemini Model Preference (defaults to gemini-2.5-flash with automatic fallbacks)
GEMINI_MODEL="gemini-2.5-flash"

# Port (defaults to 3000)
PORT=3000
```

### Running Locally
```bash
# Start development server (serves frontend + backend APIs)
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

### Building for Production
```bash
# Type check and production build
npm run lint
npm run build

# Start production server
npm start
```

---

## 6. End-to-End Automated Testing

FLOWSTATE includes an end-to-end integration test suite verifying health, authorization gates, multi-tenant workspace creation, member invitations, RAG search, voice/text AI orchestration, and deterministic audit receipts.

To execute tests against a running server:
```bash
npx tsx test-e2e.ts
```

Output:
```text
✓ Health Endpoint: 200 ok
✓ Unauthorized Access Gate (Should be 401): 401
✓ Multi-Tenant Workspaces List (Count): 2
✓ Created Org Workspace: ws-org-8dd6caeb Global Fintech Cloud Corp
✓ Invited Member to Org: security.lead@fintechcloud.com Manager
✓ RAG Semantic Search Results: 1
✓ AI Command Orchestration: 4 tasks generated with approval gate
✓ Verified Backend Execution Receipt: [VERIFIED EXECUTION] Create Support Ticket
✓ PWA Manifest Name: FLOWSTATE — Voice-Driven Workflow Automation
✓ PWA Offline Fallback HTML: 200 text/html;charset=utf-8
```

---

## 7. Device Installation Guide (PWA)

FLOWSTATE is fully configured as a standalone Progressive Web App with dedicated windowing and offline fallback.

### Desktop (Windows 11 / 10, macOS, Linux)
1. Open FLOWSTATE in Google Chrome, Microsoft Edge, or Brave.
2. Click the **Install App** icon in the browser address bar (computer with down arrow) or click the **Install App** button inside Settings / Navigation.
3. Confirm **Install**.
4. FLOWSTATE launches in an isolated native desktop window with taskbar pinning and dedicated application icon.

### Android
1. Open FLOWSTATE in Chrome or Firefox for Android.
2. Tap the browser menu (**⋮**) in the top right corner.
3. Tap **Install app** or **Add to Home screen**.
4. Confirm installation. The app icon appears on your home screen and app drawer.

### iPhone & iPad (iOS / iPadOS)
1. Open FLOWSTATE in Apple Safari.
2. Tap the **Share** button (box with upward arrow) in the Safari navigation bar.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**. FLOWSTATE opens full-screen without Safari browser toolbars.

### Desktop Native Packaging (Tauri / Electron Assessment)
- The PWA implementation satisfies all standalone desktop requirements without adding heavy multi-gigabyte build toolchains.
- For air-gapped enterprise distribution via Windows MSI/EXE or macOS DMG, FLOWSTATE can be packaged using Tauri (`@tauri-apps/cli`) by wrapping the existing `dist/` directory with zero application code changes.

---

## 8. Security & Privacy Audit Findings

- **Zero Client-Exposed Secrets:** All Gemini API keys, token signing certificates, and external integration payloads are processed exclusively on the Node.js/Express server.
- **Tenant Isolation:** Cross-tenant document queries are blocked at both the database layer and backend verification gates.
- **Human-in-the-Loop Safeguards:** Any workflow step that mutates external systems, creates customer tickets, or processes invoices requires explicit reviewer sign-off.
- **Immutable Receipts:** Every approved execution generates a cryptographically unique audit receipt logged to the workspace audit trail.
