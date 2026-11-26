import assert from 'assert';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

async function runTests() {
  console.log('--- STARTING FLOWSTATE MULTI-TENANT E2E TEST SUITE ---');

  const suffix = Date.now().toString(36);
  const ownerEmail = `owner.${suffix}@flowstate.ai`;
  const memberEmail = `member.${suffix}@flowstate.ai`;

  // 1. Health Check
  const healthResp = await fetch(`${BASE_URL}/api/health`);
  assert.strictEqual(healthResp.status, 200);
  console.log('✓ 1. Health Endpoint: 200 ok');

  // 2. Unauthorized Access Gate
  const unauthResp = await fetch(`${BASE_URL}/api/workspaces`);
  assert.strictEqual(unauthResp.status, 401);
  console.log('✓ 2. Unauthorized Access Gate: 401');

  // 3. Register Owner (Email + Password, scrypt hashed)
  const regOwner = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ownerEmail,
      password: 'SecurePassword123!',
      displayName: 'Alex Owner',
    }),
  });
  assert.strictEqual(regOwner.status, 201);
  const ownerData = await regOwner.json();
  const ownerToken = ownerData.token;
  assert.ok(ownerToken.startsWith('flowstate-jwt:'));
  console.log('✓ 3. Owner Registered & Signed JWT Issued:', ownerEmail);

  // 4. Verify Email
  const verifyResp = await fetch(`${BASE_URL}/api/auth/verify-email`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: ownerData.user.verificationToken }),
  });
  const verifyJson = await verifyResp.json();
  assert.strictEqual(verifyJson.emailVerified, true);
  console.log('✓ 4. Email Verification Completed');

  // 5. Login with Email + Password
  const loginResp = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail, password: 'SecurePassword123!' }),
  });
  assert.strictEqual(loginResp.status, 200);
  console.log('✓ 5. Email/Password Login Verified');

  // 6. Personal Onboarding & Clean-Slate Personal Workspace Verification
  const persWsResp = await fetch(`${BASE_URL}/api/workspaces/personal`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: 'Alex Private Workspace', onboardingCompleted: true }),
  });
  assert.strictEqual(persWsResp.status, 201);
  const persWsData = await persWsResp.json();
  const personalWsId = persWsData.workspace.id;

  const cleanDataResp = await fetch(`${BASE_URL}/api/workspaces/${personalWsId}/data`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const cleanData = await cleanDataResp.json();
  assert.strictEqual(cleanData.workflows.length, 0);
  assert.strictEqual(cleanData.tasks.length, 0);
  assert.strictEqual(cleanData.documents.length, 0);
  assert.strictEqual(cleanData.approvals.length, 0);
  assert.strictEqual(cleanData.notifications.length, 0);
  console.log('✓ 6. Clean-Slate Personal Workspace Verified (0 fake workflows/tasks/docs/notifications):', personalWsId);

  // 7. Organization Onboarding & Organization Workspace Creation + Invitation
  const orgWsResp = await fetch(`${BASE_URL}/api/workspaces/organization`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationName: `Acme Ops ${suffix}`,
      industry: 'Software & SaaS',
      size: '51-250 employees',
      departments: ['Customer Support', 'IT Operations', 'Billing & Finance'],
      teamInvitations: [{ email: memberEmail, role: 'Viewer', department: 'Customer Support' }],
      onboardingCompleted: true,
    }),
  });
  assert.strictEqual(orgWsResp.status, 201);
  const orgWsData = await orgWsResp.json();
  const orgWsId = orgWsData.workspace.id;
  assert.strictEqual(orgWsData.invitations.length, 1);
  console.log('✓ 7. Organization Workspace Created with Invitation:', orgWsId);

  // 8. Register Second User (Member) & Accept Invitation
  const regMember = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: memberEmail,
      password: 'MemberPassword123!',
      displayName: 'Sam Viewer',
    }),
  });
  const memberData = await regMember.json();
  const memberToken = memberData.token;
  assert.strictEqual(memberData.pendingInvitations.length, 1);
  const inviteId = memberData.pendingInvitations[0].id;

  const acceptResp = await fetch(`${BASE_URL}/api/invitations/${inviteId}/respond`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${memberToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'accept' }),
  });
  assert.strictEqual(acceptResp.status, 200);
  console.log('✓ 8. Member Registered & Accepted Invitation (Role: Viewer)');

  // 9. Cross-Tenant Isolation Test: Member CANNOT access Owner's Personal Workspace
  const crossTenantResp = await fetch(`${BASE_URL}/api/workspaces/${personalWsId}/data`, {
    headers: { Authorization: `Bearer ${memberToken}` },
  });
  assert.strictEqual(crossTenantResp.status, 403);
  console.log('✓ 9. Cross-Tenant Isolation Enforced (403 Forbidden on Personal Workspace)');

  // 10. RBAC Enforcement Test: Viewer CANNOT create a workflow in Org Workspace
  const viewerCreateWf = await fetch(`${BASE_URL}/api/workspaces/${orgWsId}/workflows`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${memberToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: 'Unauthorized Workflow' }),
  });
  assert.strictEqual(viewerCreateWf.status, 403);
  console.log('✓ 10. RBAC Enforced (403 Forbidden for Viewer creating workflow)');

  // 11. Role Upgrade by Owner (Viewer -> Member) & Verify Permission Granted
  const orgDetailsResp = await fetch(`${BASE_URL}/api/workspaces/${orgWsId}/data`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const orgDetails = await orgDetailsResp.json();
  const samMember = orgDetails.members.find((m: any) => m.email === memberEmail);
  assert.ok(samMember);

  const promoteResp = await fetch(
    `${BASE_URL}/api/workspaces/${orgWsId}/members/${samMember.id}/role`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'Member' }),
    }
  );
  assert.strictEqual(promoteResp.status, 200);

  const memberCreateWf = await fetch(`${BASE_URL}/api/workspaces/${orgWsId}/workflows`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${memberToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: 'Authorized Member Workflow', category: 'Customer Support' }),
  });
  assert.strictEqual(memberCreateWf.status, 201);
  console.log('✓ 11. Owner Promoted Viewer -> Member; Workflow Creation Now Succeeds (201)');

  // 12. Workspace Switching & Tenant-Scoped AI Command Center
  const switchResp = await fetch(`${BASE_URL}/api/workspaces/${orgWsId}/switch`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  assert.strictEqual(switchResp.status, 200);

  const aiCmdResp = await fetch(`${BASE_URL}/api/ai/command`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workspaceId: orgWsId,
      inputMode: 'voice',
      prompt: 'A customer cannot access their account. Check previous incidents, create a support ticket and assign it to the appropriate team.',
    }),
  });
  assert.strictEqual(aiCmdResp.status, 200);
  const aiCmdData = await aiCmdResp.json();
  assert.ok(aiCmdData.conversationId);
  assert.ok(aiCmdData.proposedWorkflow?.tasks?.length >= 2);
  console.log('✓ 12. Tenant-Scoped Gemini AI Command & Conversation Persisted:', aiCmdData.conversationId);

  // 13. Password Reset Flow
  const forgotResp = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ownerEmail }),
  });
  const forgotData = await forgotResp.json();
  assert.ok(forgotData.resetTokenPreview);

  const resetResp = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ownerEmail,
      token: forgotData.resetTokenPreview,
      newPassword: 'UpdatedPassword456!',
    }),
  });
  assert.strictEqual(resetResp.status, 200);
  console.log('✓ 13. Password Reset Flow Verified');

  // 14. AI Intent Classification (Question vs Discussion vs Create)
  const qResp = await fetch(`${BASE_URL}/api/ai/command`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workspaceId: personalWsId,
      prompt: 'What workflows do I have?',
    }),
  });
  const qData = await qResp.json();
  assert.strictEqual(qData.intent, 'question');
  assert.strictEqual(qData.proposedWorkflow, null);

  const dResp = await fetch(`${BASE_URL}/api/ai/command`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workspaceId: personalWsId,
      prompt: 'I want to automate customer support.',
    }),
  });
  const dData = await dResp.json();
  assert.strictEqual(dData.intent, 'discussion');
  assert.strictEqual(dData.proposedWorkflow, null);
  console.log('✓ 14. AI Intent Classification Verified (Question & Discussion do NOT create workflows)');

  // 15. Idempotent Workflow Execution & Real Notification Generation
  const wfCreateResp = await fetch(`${BASE_URL}/api/workspaces/${personalWsId}/workflows`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Manual Incident Triage',
      category: 'Customer Support',
      steps: ['Check logs', 'Notify team'],
    }),
  });
  const createdWf = await wfCreateResp.json();
  const idemKey = `idem-${suffix}`;
  const exec1 = await fetch(
    `${BASE_URL}/api/workspaces/${personalWsId}/workflows/${createdWf.id}/execute`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idempotencyKey: idemKey }),
    }
  );
  const exec1Data = await exec1.json();
  assert.strictEqual(exec1Data.duplicate, false);
  assert.strictEqual(exec1Data.workflow.status, 'completed');

  const exec2 = await fetch(
    `${BASE_URL}/api/workspaces/${personalWsId}/workflows/${createdWf.id}/execute`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idempotencyKey: idemKey }),
    }
  );
  const exec2Data = await exec2.json();
  assert.strictEqual(exec2Data.duplicate, true);

  const notifResp = await fetch(`${BASE_URL}/api/workspaces/${personalWsId}/notifications`, {
    headers: { Authorization: `Bearer ${ownerToken}` },
  });
  const notifData = await notifResp.json();
  assert.strictEqual(notifData.notifications.length, 1);
  assert.strictEqual(notifData.notifications[0].type, 'workflow_completed');
  console.log('✓ 15. Idempotent Execution & Real Notification Verified');

  // 16. Tutorial & Settings Persistence
  const profPatch = await fetch(`${BASE_URL}/api/profile`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      welcomeSeen: true,
      tutorialCompleted: true,
      themePreference: 'dark',
      timezone: 'America/New_York',
    }),
  });
  const profData = await profPatch.json();
  assert.strictEqual(profData.profile.tutorialCompleted, true);
  assert.strictEqual(profData.profile.themePreference, 'dark');
  console.log('✓ 16. Tutorial & Settings Persistence Verified');

  console.log('--- ALL 16 MULTI-TENANT & PRODUCT BEHAVIOUR E2E TESTS PASSED ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
