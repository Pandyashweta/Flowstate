# FLOWSTATE Firestore Security Specification

## 1. Data Invariants
1. All documents except `/users/{userId}/private/{docId}` are owner-scoped via `ownerId == request.auth.uid` (or bootstrapped/registered Admin).
2. PII (`email`, `phone`) is strictly isolated in `/users/{userId}/private/{docId}` with `isOwner(userId)` read/write only.
3. Every `Task` and `Approval` created must reference an existing parent `Workflow` owned by the authenticated user.
4. `AuditLog` entries are strictly append-only (`allow update, delete: if false;`).
5. Terminal state locks prevent non-admin updates once a `Workflow` is `completed` or an `Approval` is `approved`/`rejected`.
6. Every write requires `request.auth.token.email_verified == true` and server timestamps (`request.time`).
7. Non-admins cannot escalate their own `role` in `/users/{userId}`.

## 2. Dirty Dozen Attack Payloads (Expected: PERMISSION_DENIED)
1. Shadow Field Injection on `workflows`: adding `isAdminOverride: true` on create/update.
2. Identity Spoofing on `workflows`: setting `ownerId` to another user's UID.
3. Orphaned Task Creation: creating a task with a non-existent `workflowId`.
4. Audit Log Tampering: updating or deleting an existing `auditLogs/{logId}` document.
5. Terminal State Bypass: modifying an `approvals/{approvalId}` document already in `approved` state as non-admin.
6. Self-Assigned Admin Role: creating `/users/{uid}` with `role: "Admin"` by a non-admin email.
7. Unverified Email Spoof: attempting write with `email_verified: false`.
8. PII Leak Attempt: reading `/users/{otherUid}/private/info` as a non-owner.
9. Client Timestamp Spoofing: passing a forged `createdAt` not equal to `request.time`.
10. ID Poisoning: using a 200-char or symbol-injected document ID.
11. Unbounded Array Overflow: submitting 50 items in `steps` or `tags` (exceeds max limit).
12. Blanket List Scraping: querying `/workflows` without `where('ownerId', '==', uid)`.
