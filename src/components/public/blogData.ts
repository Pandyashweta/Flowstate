export type BlogCategory = 'Insights' | 'Guides' | 'Operations' | 'Engineering';

export interface BlogArticleSection {
  heading: string;
  paragraphs: string[];
  callout?: string;
}

export interface BlogPost {
  slug: string;
  category: BlogCategory;
  date: string;
  readTime: string;
  title: string;
  excerpt: string;
  coverImage: string;
  coverAlt: string;
  author: {
    name: string;
    role: string;
    avatar: string;
    initials: string;
  };
  keyTakeaways: string[];
  sections: BlogArticleSection[];
}

export const BLOG_CATEGORIES: ('All' | BlogCategory)[] = [
  'All',
  'Insights',
  'Guides',
  'Operations',
  'Engineering',
];

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'why-spoken-decisions-rarely-become-executed-workflows',
    category: 'Insights',
    date: 'Jun 24, 2026',
    readTime: '5 min read',
    title: 'Why Spoken Decisions Rarely Become Executed Workflows',
    excerpt:
      'Most operational bottlenecks happen in the five minutes after a decision is spoken. Here is how voice-native orchestration closes the translation gap.',
    coverImage: '/src/assets/images/blog_voice_workflows_1795782857670.jpg',
    coverAlt: 'Minimalist studio microphone and paper sheets on a sunlit white architectural desk',
    author: {
      name: 'Ananya Rao',
      role: 'VP of Operations',
      avatar: '/src/assets/images/waitlist_avatar_founder_1795775960980.jpg',
      initials: 'AR',
    },
    keyTakeaways: [
      'Unstructured voice decisions lose up to 60% of their original context when manually rewritten into issue trackers.',
      'Capturing intent directly at the moment of speech removes the delay between alignment and execution.',
      'Structured drafts with explicit department owners prevent repeated follow-up meetings.',
    ],
    sections: [
      {
        heading: 'The hidden tax of manual ticket translation',
        paragraphs: [
          'Every operations team knows the routine. A cross-functional incident review or weekly leadership sync ends with clear verbal agreement: audit access permissions, update vendor terms, notify IT Ops, and verify compliance before Friday. Everyone nods and closes their laptop.',
          'Forty-eight hours later, half of those commitments exist only as scattered chat messages or half-finished notes. The problem is rarely a lack of intent. It is the friction of manually translating plain human speech into multi-step tickets, checklists, and cross-department assignments.',
        ],
      },
      {
        heading: 'From passive transcripts to executable intent',
        paragraphs: [
          'Traditional note-taking tools stop at transcription. They hand you a wall of text and still expect an operations manager to read it, parse responsibilities, cross-reference internal policy, and type out every task by hand.',
          'Voice-driven workflow orchestration treats spoken language as a structured input layer. When you speak a directive into the FLOWSTATE Command Center, the system separates intent, scope, department routing, and required approvals into an actionable draft within seconds.',
        ],
        callout:
          'A transcript records what happened in the past. An orchestrated workflow defines what happens next - with clear owners and policy checks attached.',
      },
      {
        heading: 'Keeping clarity across distributed teams',
        paragraphs: [
          'When teams operate across time zones, ambiguity multiplies quickly. A single unclear handoff creates twelve follow-up messages and a second meeting to clarify the first one.',
          'By converting spoken directives into clean, inspectable workflow steps immediately, teammates who were not in the room see exact tasks, cited runbooks, and approval status without ever asking what they missed.',
        ],
      },
    ],
  },
  {
    slug: 'designing-human-in-the-loop-approval-gates',
    category: 'Guides',
    date: 'Jun 20, 2026',
    readTime: '6 min read',
    title: 'Designing Human-in-the-Loop Approval Gates Without Slowing Down Teams',
    excerpt:
      'Autonomous automation breaks trust when it executes silently. Learn how 5-tier RBAC and focused approval queues keep velocity high and risk low.',
    coverImage: '/src/assets/images/blog_approval_gates_1795782859177.jpg',
    coverAlt: 'Minimalist white architectural studio with glass walls and natural daylight',
    author: {
      name: 'Daniel Keller',
      role: 'Operations Director',
      avatar: '/src/assets/images/waitlist_avatar_director_1795775956413.jpg',
      initials: 'DK',
    },
    keyTakeaways: [
      'Separate low-risk drafting from high-impact external execution so teams stay fast without sacrificing control.',
      'Bind approval authority to explicit 5-tier workspace roles: Owner, Admin, Manager, Member, and Viewer.',
      'Surface policy citations directly inside the approval card so reviewers sign off in seconds.',
    ],
    sections: [
      {
        heading: 'Why full autonomy fails in enterprise operations',
        paragraphs: [
          'Early automation tools promised zero-touch execution, yet most security and engineering leaders quickly switched them off. Nobody wants an automated agent revoking production credentials, messaging external vendors, or modifying billing pipelines without human review.',
          'The answer is not abandoning automation - it is placing a clean, lightweight decision gate right before irreversible actions occur.',
        ],
      },
      {
        heading: 'Structuring 5-tier role boundaries',
        paragraphs: [
          'Effective governance starts with clear ownership. In FLOWSTATE, every Organization workspace separates permissions across Owners, Admins, Managers, Members, and Viewers. Any member can propose a workflow through voice or text, while sensitive actions automatically pause in the Approvals Queue.',
          'Instead of routing approval requests through buried email threads, reviewers see the exact trigger prompt, every generated step, and the internal policy document supporting the action - all on one screen.',
        ],
        callout:
          'Fast approvals require high context. When the reviewer sees the exact diff and policy citation in one view, sign-off takes ten seconds instead of two days.',
      },
      {
        heading: 'Turning every approval into a compliance asset',
        paragraphs: [
          'Every approve or reject decision carries an immutable timestamp, actor identity, and reviewer rationale. When quarterly security audits arrive, your team does not need to reconstruct who authorized a production change - the complete history is already organized and ready for export.',
        ],
      },
    ],
  },
  {
    slug: 'grounding-enterprise-ai-in-living-runbooks',
    category: 'Operations',
    date: 'Jun 15, 2026',
    readTime: '7 min read',
    title: 'Grounding Enterprise AI in Living Runbooks: A Practical RAG Architecture',
    excerpt:
      'Generic AI guesses your process. Retrieval-augmented workspaces cite your real PDF, DOCX, and TXT playbooks before drafting a single task.',
    coverImage: '/src/assets/images/blog_rag_runbooks_1795782860499.jpg',
    coverAlt: 'Stacked white operational manuals next to a matte black laptop on a bright white desk',
    author: {
      name: 'Mei Lin',
      role: 'Principal Systems Designer',
      avatar: '/src/assets/images/waitlist_avatar_designer_1795775956238.jpg',
      initials: 'ML',
    },
    keyTakeaways: [
      'Un-grounded AI workflows invent generic checklists that conflict with company compliance rules.',
      'Workspace-scoped RAG retrieval ensures every proposed workflow references current PDF, DOCX, and TXT playbooks.',
      'Inline source citations let operators verify why a step was included before approving execution.',
    ],
    sections: [
      {
        heading: 'The problem with generic operational checklists',
        paragraphs: [
          'Ask a standard language model to draft an incident escalation or vendor onboarding flow, and it will return plausible-sounding advice that has nothing to do with how your company actually operates. It will miss your legal thresholds, internal SLAs, and escalation rosters.',
          'Operational teams do not need creative improvisation - they need faithful execution of the playbooks they already spent months writing.',
        ],
      },
      {
        heading: 'How workspace-scoped retrieval works in practice',
        paragraphs: [
          'When you upload security runbooks, onboarding guides, or finance SOPs into your FLOWSTATE Knowledge Base, those documents remain strictly isolated to your workspace ID. Every time a user issues a voice or text command, the retrieval layer surfaces the most relevant policy passages first.',
          'The orchestration model then drafts workflow steps directly from those retrieved sections, attaching explicit citations so operators can inspect the exact source document.',
        ],
        callout:
          'Your knowledge base should not be a dusty archive nobody reads. Grounded RAG turns static PDFs into live operational guardrails.',
      },
      {
        heading: 'Keeping runbooks alive as teams grow',
        paragraphs: [
          'Because workflows cite active documents directly, updating a single policy file immediately updates how future workflows are drafted across every department. New hires operate with the institutional rigor of your most seasoned leads on day one.',
        ],
      },
    ],
  },
  {
    slug: 'multi-tenant-workspace-isolation-and-audit-trails',
    category: 'Engineering',
    date: 'Jun 08, 2026',
    readTime: '5 min read',
    title: 'Multi-Tenant Workspace Isolation and Exportable Audit Trails Explained',
    excerpt:
      'How to separate Personal and Organization workspaces cleanly under one account while guaranteeing verifiable CSV, JSON, and TXT audit exports.',
    coverImage: '/src/assets/images/blog_audit_isolation_1795782858034.jpg',
    coverAlt: 'Modern monochrome architectural facade with repeating white modular geometric compartments',
    author: {
      name: 'Marcus Cole',
      role: 'Staff Platform Engineer',
      avatar: '/src/assets/images/waitlist_avatar_engineer_1795775958069.jpg',
      initials: 'MC',
    },
    keyTakeaways: [
      'Strict tenant boundaries ensure zero cross-leakage between Personal and Organization workspaces.',
      'Clean-slate onboarding eliminates synthetic demo records from polluting production analytics and logs.',
      'Portable CSV, JSON, and TXT audit exports keep compliance data permanently in your hands.',
    ],
    sections: [
      {
        heading: 'Why one account still needs strict workspace walls',
        paragraphs: [
          'Modern operators wear multiple hats. You might manage private personal reminders in the morning and oversee an enterprise IT operations organization ten minutes later. Sharing one sign-in should be effortless - yet the underlying data must never blur together.',
          'In FLOWSTATE, every workflow, task, knowledge document, department, and approval record is bound to an explicit workspace ID. Switching workspaces resets client context cleanly and enforces server-side membership validation on every request.',
        ],
      },
      {
        heading: 'Zero fake demo clutter in production workspaces',
        paragraphs: [
          'Many enterprise apps pre-populate new accounts with dummy tasks and synthetic logs that pollute search results and confuse audit reviewers. Every new Personal or Organization workspace in FLOWSTATE starts completely clean.',
          'You create your own departments, upload your own runbooks, and invite real teammates - so every entry in your dashboard represents authentic operational work.',
        ],
        callout:
          'Trust in an audit log begins with data hygiene. If every record reflects real user action, compliance reviews become straightforward.',
      },
      {
        heading: 'Exportable receipts in open formats',
        paragraphs: [
          'Operational history should never be locked inside a proprietary dashboard. Under Workspace Settings, Owners and Admins can export complete execution, approval, and permission histories in CSV for spreadsheets, JSON for SIEM pipelines, or plain TXT for archival review.',
        ],
      },
    ],
  },
];
