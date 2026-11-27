import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Download,
  Menu,
  Play,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { BLOG_CATEGORIES, BLOG_POSTS, BlogCategory } from './blogData';
import { BlogArchiveView, BlogArticleView, BlogEditorialImage } from './BlogViews';
import { ContactView } from './ContactView';
import { Footer } from './Footer';
import {
  ARIXO_EASE,
  ARIXO_SNAPPY_SPRING,
  CompactAudioVisualizer,
  InfiniteLogoTicker,
  MaskedHeadlineLine,
  ScrollReveal,
  ScrollTiltFrame,
  SmoothAccordionBody,
} from './MotionPrimitives';
import {
  FeatureVisualApprovals,
  FeatureVisualExports,
  FeatureVisualRag,
  FeatureVisualVoice,
  ProblemCardAsyncBrief,
  ProblemCardOwnership,
  ProblemCardTranscript,
} from './LandingShowcases';

interface PublicWebsiteProps {
  onSignIn: () => void;
  onRegister: () => void;
  onOpenWaitlist: () => void;
  onInstallPwa: () => void;
  canInstall: boolean;
}

type PublicSubPage =
  | { view: 'home' }
  | { view: 'blog' }
  | { view: 'blog-post'; slug: string }
  | { view: 'contact' };

type SidebarFilter = 'All' | 'Engineering' | 'Security' | 'Approvals';

interface MockWorkflowItem {
  id: string;
  title: string;
  meta: string;
  statusLabel: string;
  isLive?: boolean;
  needsApproval?: boolean;
  department: string;
  citedDoc: string;
  transcript: { time: string; line: string }[];
  actions: { id: string; text: string }[];
  checks: { label: string; value: string; percent: number }[];
}

const HERO_WORKFLOWS: MockWorkflowItem[] = [
  {
    id: 'wf-1',
    title: 'Q4 Security Access Audit',
    meta: 'Today · 9:00 AM · 5 participants',
    statusLabel: 'Live',
    isLive: true,
    needsApproval: true,
    department: 'Security',
    citedDoc: 'Security_Runbook_2026.pdf',
    transcript: [
      { time: '0:04', line: 'Okay so the main thing we need to execute today is the Q4 access log audit...' },
      { time: '0:18', line: 'Cross-check contractor credentials against Section 3 of the Security Runbook.' },
      { time: '0:31', line: 'Assign remediation tasks to Engineering and pause key revocations for Owner review.' },
      { time: '0:44', line: 'That works — lock that workflow and export the CSV audit receipt once approved.' },
    ],
    actions: [
      { id: 'a1', text: 'Audit stale IAM tokens against Security_Runbook_2026.pdf' },
      { id: 'a2', text: 'Assign Engineering remediation owner with SLA' },
      { id: 'a3', text: 'Route production revocation to Owner Approvals Queue' },
    ],
    checks: [
      { label: 'Runbook grounding', value: 'Cited', percent: 96 },
      { label: 'Approval gate', value: 'Owner', percent: 90 },
      { label: 'Audit export', value: 'CSV / JSON', percent: 100 },
    ],
  },
  {
    id: 'wf-2',
    title: 'Weekly Standup — Engineering',
    meta: 'Tomorrow · 10:00 AM · Engineering',
    statusLabel: 'Scheduled',
    needsApproval: true,
    department: 'Engineering',
    citedDoc: 'Release_Checklist_2026.docx',
    transcript: [
      { time: '0:03', line: 'Prepare the Friday deployment workflow and verify rollback owners.' },
      { time: '0:16', line: 'Pull the release freeze criteria from Release_Checklist_2026.docx.' },
      { time: '0:29', line: 'Hold production cutover until Admin approves the staging telemetry check.' },
    ],
    actions: [
      { id: 'b1', text: 'Verify staging health metrics prior to release freeze' },
      { id: 'b2', text: 'Assign on-call rollback lead in Engineering' },
      { id: 'b3', text: 'Queue production sign-off for Workspace Admin' },
    ],
    checks: [
      { label: 'Runbook grounding', value: 'Cited', percent: 92 },
      { label: 'Approval gate', value: 'Admin', percent: 88 },
      { label: 'Audit export', value: 'Ready', percent: 100 },
    ],
  },
  {
    id: 'wf-3',
    title: 'Vendor Onboarding — Legal Gate',
    meta: 'Yesterday · 2:30 PM · 62 min · 4 participants',
    statusLabel: 'Done',
    needsApproval: true,
    department: 'Security',
    citedDoc: 'Vendor_Procurement_SOP.pdf',
    transcript: [
      { time: '0:05', line: 'Start vendor onboarding for Meridian Infrastructure ahead of Monday.' },
      { time: '0:19', line: 'Verify SOC2 Type II report and DPA terms from our procurement guide.' },
      { time: '0:33', line: 'Route final contract sign-off to Legal and notify Finance when approved.' },
    ],
    actions: [
      { id: 'c1', text: 'Check DPA clauses against Vendor_Procurement_SOP.pdf' },
      { id: 'c2', text: 'Route MSA authorization to Legal Approvals Queue' },
      { id: 'c3', text: 'Trigger Finance vendor portal setup after approval' },
    ],
    checks: [
      { label: 'Runbook grounding', value: '2 citations', percent: 100 },
      { label: 'Approval gate', value: 'Approved', percent: 100 },
      { label: 'Audit export', value: 'Archived', percent: 100 },
    ],
  },
  {
    id: 'wf-4',
    title: 'P1 Incident Escalation Runbook',
    meta: 'Mar 20 · 11:00 AM · 34 min · 7 participants',
    statusLabel: 'Done',
    department: 'Engineering',
    citedDoc: 'Incident_Response_Playbook.pdf',
    transcript: [
      { time: '0:04', line: 'Escalate the EU webhook latency spike to P1 immediately.' },
      { time: '0:17', line: 'Follow Section 4 of Incident_Response_Playbook.pdf and page on-call.' },
      { time: '0:31', line: 'Draft customer status note for Manager approval and archive JSON log.' },
    ],
    actions: [
      { id: 'd1', text: 'Page IT Operations on-call lead with latency trace' },
      { id: 'd2', text: 'Publish customer status update after Manager sign-off' },
      { id: 'd3', text: 'Export incident receipt to JSON audit trail' },
    ],
    checks: [
      { label: 'Runbook grounding', value: 'Section 4', percent: 100 },
      { label: 'Approval gate', value: 'Approved', percent: 100 },
      { label: 'Audit export', value: 'Exported', percent: 100 },
    ],
  },
  {
    id: 'wf-5',
    title: 'Quarterly SOC2 Evidence Export',
    meta: 'Mar 19 · 3:00 PM · 28 min · 2 participants',
    statusLabel: 'Done',
    department: 'Security',
    citedDoc: 'Audit_Checklist_Q4.txt',
    transcript: [
      { time: '0:04', line: 'Compile Q4 workflow approvals and role changes for our auditor.' },
      { time: '0:19', line: 'Keep Personal workspace logs isolated and export Organization records only.' },
    ],
    actions: [
      { id: 'e1', text: 'Scope export strictly to Organization workspace ID' },
      { id: 'e2', text: 'Verify Owner and Admin approval signatures' },
      { id: 'e3', text: 'Download CSV, JSON, and TXT compliance bundle' },
    ],
    checks: [
      { label: 'Tenant isolation', value: 'Strict', percent: 100 },
      { label: 'Approval gate', value: 'Verified', percent: 100 },
      { label: 'Audit export', value: '3 formats', percent: 100 },
    ],
  },
];

const ARIXO_FEATURES = [
  {
    id: 'feature-1',
    anchor: 'feature-1',
    accordionTitle: 'Auto-captures every word',
    accordionBody:
      'Speak naturally in the AI Command Center or type a directive. Flowstate transcribes in real time, extracts operational intent, and drafts ordered steps automatically.',
    cardTitle: 'Auto-captures every word',
    cardSubtitle:
      'Flowstate captures spoken or written commands in real time — timestamped, structured, and immediately searchable.',
    visualType: 'voice' as const,
  },
  {
    id: 'feature-2',
    anchor: 'feature-2',
    accordionTitle: 'Every policy, grounded',
    accordionBody:
      'Upload PDF, DOCX, and TXT playbooks into your workspace Knowledge Base so every generated workflow cites your exact internal runbooks instead of guessing.',
    cardTitle: 'Every policy, instantly grounded',
    cardSubtitle:
      'No more guessing which SOP applies. Flowstate retrieves your uploaded runbooks and attaches verifiable citations before a task is created.',
    visualType: 'rag' as const,
  },
  {
    id: 'feature-3',
    anchor: 'feature-3',
    accordionTitle: 'Every task, human-approved',
    accordionBody:
      'High-impact steps pause automatically in the Approvals Queue for Owner, Admin, or Manager sign-off under strict 5-tier RBAC boundaries.',
    cardTitle: 'Every sensitive task, human-approved',
    cardSubtitle:
      'Keep full velocity without risking silent external actions. Reviewers inspect the prompt, steps, and cited runbook in one view before approving.',
    visualType: 'approvals' as const,
  },
  {
    id: 'feature-4',
    anchor: 'feature-4',
    accordionTitle: 'Runs where your team works',
    accordionBody:
      'Isolate Personal and Organization workspaces, connect email, webhooks, and REST endpoints, and download complete audit trails in CSV, JSON, or TXT anytime.',
    cardTitle: 'Runs where your team already works',
    cardSubtitle:
      'Install Flowstate directly from your browser as a lightweight app and export immutable execution records in open formats whenever compliance asks.',
    visualType: 'exports' as const,
  },
];

interface TestimonialStory {
  id: string;
  name: string;
  role: string;
  quote: string;
  videoImage?: string;
  videoAlt?: string;
}

const TESTIMONIAL_COLUMNS: TestimonialStory[][] = [
  [
    {
      id: 't1',
      name: 'Ryan Choi',
      role: 'Head of Operations · Northstar Cloud',
      quote:
        'I used to split my attention between leading incident calls and typing tickets afterward — and ended up doing both badly. Now I stay present and walk out with grounded workflows and clear owners.',
    },
    {
      id: 't2',
      name: 'Marcus Kim',
      role: 'VP of Engineering · Kestrel Systems',
      quote:
        'We did not realize how much operational context we were losing until we moved our runbooks into Flowstate. Half our decisions used to vanish in chat threads. Now every workflow ends with verified citations and clear ownership.',
    },
    {
      id: 't3',
      name: 'Daniel Foster',
      role: 'Co-founder & COO · Veridian',
      quote:
        'Before Flowstate, our operations reviews were a black box. Decisions happened verbally, nobody documented them, and two weeks later everything got relitigated. Now we run the command, approve the gate, and move on.',
      videoImage: '/src/assets/images/waitlist_avatar_director_1795775956413.jpg',
      videoAlt: 'Daniel Foster, Co-founder and COO at Veridian',
    },
  ],
  [
    {
      id: 't4',
      name: 'Sarah Reeves',
      role: 'Security Lead · Meridian Bio',
      quote:
        'We used to end every audit prep with messy spreadsheets and ten Slack pings asking who approved what. With Flowstate, every Owner sign-off and runbook citation exports cleanly to CSV and JSON in seconds.',
    },
    {
      id: 't5',
      name: 'Ananya Rao',
      role: 'VP of Operations · Helios Logistics',
      quote:
        'Having one account that separates my private Personal workspace from our multi-department Organization workspace changed how our leadership runs daily operations.',
      videoImage: '/src/assets/images/waitlist_avatar_founder_1795775960980.jpg',
      videoAlt: 'Ananya Rao, VP of Operations at Helios Logistics',
    },
    {
      id: 't6',
      name: 'Tom Okafor',
      role: 'Staff Platform Lead · Vanguard Core',
      quote:
        'Zero fake demo clutter when we launched our organization. We created our own departments, uploaded four PDF playbooks, and executed our first governed voice workflow inside five minutes.',
    },
  ],
  [
    {
      id: 't7',
      name: 'Nadia Petrov',
      role: 'Director of IT · Linden Labs',
      quote:
        'Stand-ups, vendor reviews, access audits — every single one gets the same treatment. Voice capture, runbook grounding, Owner approval, exportable receipt. It saves us hours every week.',
    },
    {
      id: 't8',
      name: 'Mei Lin',
      role: 'Principal Systems Designer · Crestline',
      quote:
        'Our distributed team used to constantly ask what policy applied or who owned the next step. Now everyone sees the exact cited runbook, task owners, and approval trail immediately.',
      videoImage: '/src/assets/images/waitlist_avatar_designer_1795775956238.jpg',
      videoAlt: 'Mei Lin, Principal Systems Designer at Crestline',
    },
    {
      id: 't9',
      name: 'Marcus Cole',
      role: 'Staff Engineer · Nordik Systems',
      quote:
        'Installing Flowstate directly through the browser gave our ops leads instant voice command access across desktop and mobile without waiting on IT installers.',
    },
  ],
];

const EXTRA_TESTIMONIALS: TestimonialStory[] = [
  {
    id: 't10',
    name: 'James Torres',
    role: 'Head of Product Ops · Aerohive',
    quote:
      'Our async teammates across three time zones no longer ask what they missed. They get the structured workflow, cited playbooks, and approval state within seconds.',
  },
  {
    id: 't11',
    name: 'Elena Morales',
    role: 'Operations Manager · Velvora',
    quote:
      'Every sensitive action pauses cleanly in the Approvals Queue. We get the speed of AI orchestration with the rigor of human governance.',
  },
  {
    id: 't12',
    name: 'Hannah Lindqvist',
    role: 'Chief of Staff · Lume Studio',
    quote:
      'Cleanest operational software we have adopted all year. No clutter, strict role isolation, and real CSV and JSON audit exports.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Can I use both Personal and Organization workspaces under one account?',
    a: 'Yes — one account lets you keep a private Personal workspace while creating or joining multiple Organization workspaces with custom logos, user-created departments, and strict tenant isolation.',
  },
  {
    q: 'How does Flowstate ground workflows in my internal policies?',
    a: 'Upload your PDF, DOCX, or TXT playbooks into your workspace Knowledge Base. Every time you speak or type an instruction, Flowstate retrieves relevant policy passages from your workspace and cites them directly inside the drafted workflow.',
  },
  {
    q: 'Do sensitive workflows run without human authorization?',
    a: 'No — sensitive or external steps automatically pause inside the Approvals Queue so Owners, Admins, or Managers can review the full prompt, steps, and cited runbook before clicking Approve or Reject.',
  },
  {
    q: 'Where does my workspace data go?',
    a: 'Every record, uploaded document, and audit log is strictly scoped to its workspace ID. We never share documents across tenants or train public models on your workspace playbooks.',
  },
  {
    q: 'Do new workspaces come filled with fake demo data, and can I export audit logs?',
    a: 'Every new workspace starts completely clean with zero pre-made tasks or synthetic records. Authorized roles can export full audit histories anytime in CSV, JSON, or TXT formats from Settings.',
  },
];

const HERO_AVATARS = [
  { src: '/src/assets/images/waitlist_avatar_founder_1795775960980.jpg', alt: 'Ananya Rao', initials: 'AR' },
  { src: '/src/assets/images/waitlist_avatar_director_1795775956413.jpg', alt: 'Daniel Keller', initials: 'DK' },
  { src: '/src/assets/images/waitlist_avatar_designer_1795775956238.jpg', alt: 'Mei Lin', initials: 'ML' },
  { src: '/src/assets/images/waitlist_avatar_engineer_1795775958069.jpg', alt: 'Marcus Cole', initials: 'MC' },
];

const HOW_IT_WORKS_STEPS = [
  {
    num: '01',
    title: 'Connect your workspace & docs',
    body: 'Create a clean Personal or Organization workspace in one click. Define your own departments and upload your PDF, DOCX, or TXT playbooks.',
    foot: 'Takes 60 seconds',
  },
  {
    num: '02',
    title: 'Flowstate listens & drafts',
    body: 'Speak or type any operational directive in the AI Command Center. Flowstate cites your runbooks, drafts ordered tasks, and routes owners in real time.',
    foot: 'Fully grounded',
  },
  {
    num: '03',
    title: 'Approve & export in 30 seconds',
    body: 'Review sensitive actions inside the Approvals Queue before execution — then export verifiable CSV, JSON, and TXT audit trails anytime.',
    foot: '100% auditable',
  },
];

function parseInitialSubPage(): PublicSubPage {
  if (typeof window === 'undefined') return { view: 'home' };
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/blog') return { view: 'blog' };
  if (path.startsWith('/blog/')) {
    const slug = path.slice('/blog/'.length);
    if (BLOG_POSTS.some((p) => p.slug === slug)) {
      return { view: 'blog-post', slug };
    }
    return { view: 'blog' };
  }
  if (path === '/contact') return { view: 'contact' };
  return { view: 'home' };
}

function formatLiveElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  onSignIn,
  onRegister,
  onOpenWaitlist,
  onInstallPwa,
}) => {
  const [subPage, setSubPage] = useState<PublicSubPage>(parseInitialSubPage);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  // Hero 3-Pane Interactive Workspace state
  const [sidebarFilter, setSidebarFilter] = useState<SidebarFilter>('All');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(HERO_WORKFLOWS[0].id);
  const [heroSearch, setHeroSearch] = useState('');
  const [liveSeconds, setLiveSeconds] = useState(47 * 60 + 12);
  const [liveTranscriptHighlight, setLiveTranscriptHighlight] = useState(3);
  const [completedActionIds, setCompletedActionIds] = useState<Record<string, boolean>>({
    a1: true,
    a2: true,
    b1: true,
    c1: true,
    c2: true,
    c3: true,
    d1: true,
    d2: true,
    d3: true,
    e1: true,
    e2: true,
    e3: true,
  });

  // Features sticky left accordion + Scroll-Spy refs
  const [openFeatureId, setOpenFeatureId] = useState<string>(ARIXO_FEATURES[0].id);
  const featureCardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Testimonials video story modal + view more toggle
  const [activeStoryModal, setActiveStoryModal] = useState<TestimonialStory | null>(null);
  const [showMoreTestimonials, setShowMoreTestimonials] = useState(false);

  // Home 4-Blog category filter
  const [homeBlogCategory, setHomeBlogCategory] = useState<'All' | BlogCategory>('All');

  // FAQ accordion state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Navbar scroll elevation listener
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setNavScrolled(latest > 24);
  });

  // Live ticking timer + active transcript shimmer in hero mockup
  useEffect(() => {
    if (subPage.view !== 'home') return;
    const secTimer = window.setInterval(() => {
      setLiveSeconds((s) => s + 1);
    }, 1000);
    const lineTimer = window.setInterval(() => {
      setLiveTranscriptHighlight((prev) => (prev + 1) % 4);
    }, 3200);
    return () => {
      window.clearInterval(secTimer);
      window.clearInterval(lineTimer);
    };
  }, [subPage.view]);

  // Real IntersectionObserver Scroll-Spy for Arixo Sticky Left Accordion
  useEffect(() => {
    if (subPage.view !== 'home' || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          const id = visible[0].target.getAttribute('data-feature-id');
          if (id) setOpenFeatureId(id);
        }
      },
      {
        rootMargin: '-28% 0px -38% 0px',
        threshold: [0.2, 0.45, 0.7],
      }
    );

    ARIXO_FEATURES.forEach((f) => {
      const node = featureCardRefs.current[f.id];
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [subPage.view]);

  const navigateSubPage = useCallback((next: PublicSubPage, pushHistory = true) => {
    setSubPage(next);
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      if (pushHistory) {
        const targetPath =
          next.view === 'blog'
            ? '/blog'
            : next.view === 'blog-post'
            ? `/blog/${next.slug}`
            : next.view === 'contact'
            ? '/contact'
            : '/';
        if (window.location.pathname !== targetPath) {
          window.history.pushState({ publicSubPage: next }, '', targetPath);
        }
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setSubPage(parseInitialSubPage());
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    if (!activeStoryModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveStoryModal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeStoryModal]);

  const navigateHomeSection = useCallback(
    (sectionId: string) => {
      setMobileMenuOpen(false);
      if (sectionId === 'top') {
        navigateSubPage({ view: 'home' });
        return;
      }
      if (subPage.view !== 'home') {
        navigateSubPage({ view: 'home' });
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 80);
      } else {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [subPage.view, navigateSubPage]
  );

  const handleSelectFeatureAccordion = (featureId: string) => {
    setOpenFeatureId(featureId);
    const target = document.getElementById(featureId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const filteredHeroWorkflows = HERO_WORKFLOWS.filter((wf) => {
    const matchesSidebar =
      sidebarFilter === 'All'
        ? true
        : sidebarFilter === 'Approvals'
        ? Boolean(wf.needsApproval)
        : wf.department === sidebarFilter;
    const q = heroSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      wf.title.toLowerCase().includes(q) ||
      wf.department.toLowerCase().includes(q) ||
      wf.citedDoc.toLowerCase().includes(q);
    return matchesSidebar && matchesQuery;
  });

  const activeWorkflow =
    filteredHeroWorkflows.find((w) => w.id === selectedWorkflowId) ||
    filteredHeroWorkflows[0] ||
    HERO_WORKFLOWS[0];

  const filteredHomeBlogs =
    homeBlogCategory === 'All'
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.category === homeBlogCategory);

  const activeArticle =
    subPage.view === 'blog-post'
      ? BLOG_POSTS.find((p) => p.slug === subPage.slug) || BLOG_POSTS[0]
      : null;

  const navItems = [
    { key: 'features', label: 'Features', action: () => navigateHomeSection('features'), active: false },
    { key: 'how', label: 'How it works', action: () => navigateHomeSection('how-it-works'), active: false },
    {
      key: 'blog',
      label: 'Blog',
      action: () => navigateSubPage({ view: 'blog' }),
      active: subPage.view === 'blog' || subPage.view === 'blog-post',
    },
    { key: 'waitlist', label: 'Waitlist', action: onOpenWaitlist, active: false },
    {
      key: 'contact',
      label: 'Contact',
      action: () => navigateSubPage({ view: 'contact' }),
      active: subPage.view === 'contact',
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div
        id="top"
        className="min-h-screen bg-white text-black flex flex-col font-sans selection:bg-black selection:text-white"
      >
        {/* FLOATING ARIXO NAVBAR (White surface, black ink, black dot, NO Pricing, Framer entrance & hover physics) */}
        <motion.header
          initial={{ y: -14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.05, ease: ARIXO_EASE }}
          className="sticky top-0 z-40 w-full px-4 sm:px-8 pt-4 pb-2 pointer-events-none"
        >
          <div
            className={`pointer-events-auto max-w-[1120px] mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 h-14 rounded-2xl border transition-all duration-300 ${
              navScrolled
                ? 'bg-white/95 backdrop-blur-md border-black/[0.1] shadow-[0_8px_30px_rgba(0,0,0,0.06)]'
                : 'bg-white/90 backdrop-blur-sm border-black/[0.07] shadow-[0_2px_12px_rgba(0,0,0,0.025)]'
            }`}
          >
            {/* Zone 1: Single-line Wordmark + Signature Black Dot */}
            <button
              type="button"
              onClick={() => navigateSubPage({ view: 'home' })}
              className="group inline-flex items-baseline font-display text-[23px] font-semibold tracking-[-0.06em] leading-none text-black whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-sm"
            >
              <span>Flowstate</span>
              <span className="text-black font-bold transition-transform duration-200 group-hover:scale-125 inline-block">
                .
              </span>
            </button>

            {/* Zone 2: Clean Single-Line Text Nav Links with Sliding Hover Backdrop (NO Pricing) */}
            <nav
              aria-label="Primary navigation"
              onMouseLeave={() => setHoveredNav(null)}
              className="hidden md:flex items-center gap-1 text-[14px] font-normal text-neutral-600"
            >
              {navItems.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onMouseEnter={() => setHoveredNav(item.key)}
                  onClick={item.action}
                  className={`relative px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    item.active ? 'text-black font-medium' : 'hover:text-black'
                  }`}
                >
                  {hoveredNav === item.key && (
                    <motion.span
                      layoutId="arixoNavHover"
                      transition={ARIXO_SNAPPY_SPRING}
                      className="absolute inset-0 bg-black/[0.045] rounded-lg"
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              ))}
            </nav>

            {/* Zone 3: Sign in + Primary CTA with spring press */}
            <div className="hidden md:flex items-center gap-4 shrink-0">
              <button
                type="button"
                onClick={onSignIn}
                className="text-[14px] font-medium text-neutral-700 hover:text-black transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Sign in
              </button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={ARIXO_SNAPPY_SPRING}
                onClick={onRegister}
                className="group inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden w-9 h-9 rounded-lg border border-black/10 flex items-center justify-center text-black hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {/* Animated Mobile Dropdown */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: ARIXO_EASE }}
                className="pointer-events-auto md:hidden max-w-[1120px] mx-auto mt-2 p-5 rounded-2xl border border-black/10 bg-white shadow-xl space-y-4"
              >
                <div className="flex flex-col space-y-2.5 text-sm font-medium text-neutral-700">
                  {navItems.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        item.action();
                      }}
                      className="text-left py-1 hover:text-black cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="pt-3 border-t border-black/10 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onSignIn();
                    }}
                    className="flex-1 py-2.5 rounded-lg border border-neutral-300 text-xs font-medium text-black cursor-pointer"
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onRegister();
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-black text-white text-xs font-medium cursor-pointer"
                  >
                    Get Started
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Sub-pages: Blog Archive, Single Blog Reader, Contact */}
        {subPage.view === 'blog' && (
          <BlogArchiveView
            onSelectPost={(slug) => navigateSubPage({ view: 'blog-post', slug })}
            onRegister={onRegister}
            onOpenWaitlist={onOpenWaitlist}
          />
        )}

        {subPage.view === 'blog-post' && activeArticle && (
          <BlogArticleView
            post={activeArticle}
            onBackToBlog={() => navigateSubPage({ view: 'blog' })}
            onSelectPost={(slug) => navigateSubPage({ view: 'blog-post', slug })}
            onRegister={onRegister}
          />
        )}

        {subPage.view === 'contact' && (
          <ContactView onRegister={onRegister} onOpenWaitlist={onOpenWaitlist} />
        )}

        {/* MAIN HOME PAGE — KINETIC ARIXO EDITORIAL ARCHITECTURE (PURE WHITE, BLACK FONT, BLACK DOT) */}
        {subPage.view === 'home' && (
          <main className="flex-1 bg-white text-black">
            {/* 1. HERO SECTION — LEFT-ALIGNED MASKED REVEAL + SCROLL-TILT 3-PANE LIVING APP SCREEN */}
            <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 px-6 sm:px-12">
              <div className="max-w-[1280px] mx-auto flex flex-col items-start gap-8">
                {/* Left-Aligned Header Stack */}
                <div className="flex flex-col items-start gap-5 max-w-[820px]">
                  {/* Clean Unboxed Eyebrow */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.06, ease: ARIXO_EASE }}
                    className="inline-flex items-center gap-2.5 text-[13px] font-medium text-neutral-600"
                  >
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-[5px] bg-black text-white font-display font-bold text-[11px]">
                      F
                    </span>
                    <span>Voice-Driven Enterprise Workflow Automation</span>
                  </motion.div>

                  {/* Masked Line-by-Line Editorial Display Headline with Signature Black Dot */}
                  <h1
                    className="font-display font-medium tracking-[-0.045em] leading-[1.03] text-black [text-wrap:balance]"
                    style={{ fontSize: 'clamp(2.85rem, 6.2vw, 5.25rem)' }}
                  >
                    <MaskedHeadlineLine delay={0.1}>Never write manual</MaskedHeadlineLine>
                    <MaskedHeadlineLine delay={0.19}>
                      workflow tickets again<span className="text-black">.</span>
                    </MaskedHeadlineLine>
                  </h1>

                  {/* Concise Left-Aligned Subheadline */}
                  <motion.p
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.28, ease: ARIXO_EASE }}
                    className="text-base sm:text-[18px] text-neutral-600 font-normal leading-[1.55] max-w-[540px]"
                  >
                    Flowstate captures your voice or text commands, checks your runbooks, and delivers structured workflows, assigned tasks, and approval gates — before you even close the tab.
                  </motion.p>

                  {/* CTA Buttons Row with Spring Tactility */}
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.36, ease: ARIXO_EASE }}
                    className="flex flex-wrap items-center gap-2.5 pt-2"
                  >
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={ARIXO_SNAPPY_SPRING}
                      onClick={onRegister}
                      className="group inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-black hover:bg-neutral-800 text-white text-[14px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Try Flowstate free</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={ARIXO_SNAPPY_SPRING}
                      onClick={() => navigateHomeSection('how-it-works')}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white hover:bg-neutral-100 text-black border border-black/15 text-[14px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>See how it works</span>
                    </motion.button>
                    <button
                      type="button"
                      onClick={onInstallPwa}
                      className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-lg text-neutral-600 hover:text-black text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Install app</span>
                    </button>
                  </motion.div>

                  {/* Credibility Stack (Interactive Avatar Fan on Hover) */}
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.44, ease: ARIXO_EASE }}
                    className="group/avatars flex items-center gap-3 pt-1"
                  >
                    <div className="flex items-center -space-x-2 group-hover/avatars:-space-x-1 transition-all duration-300">
                      {HERO_AVATARS.map((av) => (
                        <img
                          key={av.alt}
                          src={av.src}
                          alt={av.alt}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover grayscale ring-2 ring-white transition-transform duration-300 hover:scale-110 hover:z-10"
                        />
                      ))}
                    </div>
                    <span className="text-[13px] text-neutral-600">
                      <strong className="font-medium text-black tabular-nums">4,200+</strong> teams already use Flowstate
                    </span>
                  </motion.div>
                </div>

                {/* ARIXO SIGNATURE ELEVATED 3-PANE BROWSER UI SCREEN (Scroll-Linked 3D Perspective Lift + Living Motion) */}
                <ScrollTiltFrame className="w-full mt-4">
                  <div className="w-full rounded-2xl border border-black/[0.09] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.045),0_28px_84px_rgba(0,0,0,0.08)] overflow-hidden">
                    {/* Browser Header Bar */}
                    <div className="h-11 px-4 border-b border-black/[0.08] bg-[#FAFAFA] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-black" />
                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                      </div>
                      <div className="px-4 py-1 rounded-md bg-white border border-black/[0.07] text-[11px] font-mono text-neutral-500">
                        app.flowstate.ai / workflows
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-neutral-500 tabular-nums">
                        <CompactAudioVisualizer bars={5} height={11} active />
                        <span>{formatLiveElapsed(liveSeconds)}</span>
                      </div>
                    </div>

                    {/* Main 3-Column Interactive App Screen */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[530px]">
                      {/* Left Interactive Sidebar */}
                      <aside className="hidden lg:flex lg:col-span-2 border-r border-black/[0.07] bg-[#FAFAFA] p-4 flex-col justify-between text-xs">
                        <div className="space-y-6">
                          <div>
                            <div className="text-[11px] font-medium text-neutral-400 px-2.5 mb-2">
                              Workspace
                            </div>
                            <div className="space-y-1">
                              {(
                                [
                                  { id: 'All', label: 'All Workflows', count: HERO_WORKFLOWS.length },
                                  { id: 'Security', label: 'Security', count: 3 },
                                  { id: 'Engineering', label: 'Engineering', count: 2 },
                                  { id: 'Approvals', label: 'Approvals', count: 3 },
                                ] as const
                              ).map((nav) => {
                                const active = sidebarFilter === nav.id;
                                return (
                                  <button
                                    key={nav.id}
                                    type="button"
                                    onClick={() => setSidebarFilter(nav.id)}
                                    className={`relative w-full px-2.5 py-2 rounded-lg text-left font-medium flex items-center justify-between cursor-pointer transition-colors ${
                                      active ? 'text-white' : 'text-neutral-600 hover:text-black'
                                    }`}
                                  >
                                    {active && (
                                      <motion.span
                                        layoutId="heroSidebarPill"
                                        transition={ARIXO_SNAPPY_SPRING}
                                        className="absolute inset-0 bg-black rounded-lg"
                                      />
                                    )}
                                    <span className="relative z-10 truncate">{nav.label}</span>
                                    <span
                                      className={`relative z-10 font-mono text-[10px] tabular-nums ${
                                        active ? 'text-neutral-300' : 'text-neutral-400'
                                      }`}
                                    >
                                      {nav.count}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="px-2.5 space-y-1.5 text-[11px] text-neutral-500">
                            <div className="font-medium text-neutral-400">Governance</div>
                            <div>5-Tier RBAC</div>
                            <div>RAG Runbooks</div>
                            <div>Audit Exports</div>
                          </div>
                        </div>

                        <div className="px-2.5 pt-3 border-t border-black/[0.07] text-[11px] text-neutral-400">
                          Organization · Isolated
                        </div>
                      </aside>

                      {/* Center Workflows List Panel */}
                      <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-black/[0.07] p-5 sm:p-6 bg-white flex flex-col">
                        <div className="flex items-baseline justify-between gap-2 mb-4">
                          <div>
                            <div className="font-display text-[15px] font-semibold text-black">
                              {sidebarFilter === 'All' ? 'All Workflows' : `${sidebarFilter} Queue`}
                            </div>
                            <div className="text-[12px] text-neutral-500 tabular-nums">
                              November 2026 · {filteredHeroWorkflows.length} shown
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={onRegister}
                            className="text-xs font-medium text-black hover:underline cursor-pointer whitespace-nowrap"
                          >
                            + New
                          </button>
                        </div>

                        {/* Live Search Field */}
                        <div className="relative mb-4">
                          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={heroSearch}
                            onChange={(e) => setHeroSearch(e.target.value)}
                            aria-label="Search demo workflows"
                            placeholder="Search workflows or runbooks..."
                            className="w-full h-9 pl-8.5 pr-3 rounded-lg bg-[#F7F7F7] border border-black/[0.07] text-xs text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                          />
                        </div>

                        {/* Interactive Animated Workflows Rows */}
                        <div className="space-y-1 flex-1">
                          {filteredHeroWorkflows.map((wf) => {
                            const selected = wf.id === activeWorkflow.id;
                            return (
                              <motion.button
                                key={wf.id}
                                layout
                                type="button"
                                onClick={() => setSelectedWorkflowId(wf.id)}
                                transition={ARIXO_SNAPPY_SPRING}
                                className="relative w-full text-left py-3.5 px-3 rounded-xl flex items-start justify-between gap-3 cursor-pointer transition-colors hover:bg-black/[0.025]"
                              >
                                {selected && (
                                  <motion.span
                                    layoutId="heroActiveWorkflowRow"
                                    transition={ARIXO_SNAPPY_SPRING}
                                    className="absolute inset-0 bg-[#F4F4F4] border border-black/[0.06] rounded-xl"
                                  />
                                )}
                                <div className="relative z-10 flex items-start gap-2.5 min-w-0">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 transition-colors ${
                                      selected ? 'bg-black' : 'bg-neutral-300'
                                    }`}
                                  />
                                  <div className="min-w-0">
                                    <div className="text-[13px] font-medium text-black truncate">
                                      {wf.title}
                                    </div>
                                    <div className="text-[11px] text-neutral-500 mt-0.5 truncate">
                                      {wf.meta}
                                    </div>
                                  </div>
                                </div>
                                <div className="relative z-10 flex items-center gap-2 shrink-0 mt-0.5">
                                  {wf.isLive && (
                                    <CompactAudioVisualizer bars={4} height={11} active />
                                  )}
                                  <span className="text-[11px] font-mono text-black">
                                    {wf.statusLabel}
                                  </span>
                                </div>
                              </motion.button>
                            );
                          })}
                          {filteredHeroWorkflows.length === 0 && (
                            <div className="py-10 text-center text-xs text-neutral-500">
                              No workflows match “{heroSearch}”.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Inspector Panel with Smooth AnimatePresence Workflow Switching */}
                      <div className="lg:col-span-5 p-5 sm:p-6 bg-[#FAFAFA] flex flex-col justify-between gap-4">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeWorkflow.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.24, ease: ARIXO_EASE }}
                            className="flex flex-col justify-between gap-4 h-full"
                          >
                            {/* Live Transcript Card */}
                            <div className="bg-white border border-black/[0.07] rounded-xl p-4 space-y-2.5">
                              <div className="flex items-center justify-between text-xs gap-2">
                                <span className="font-medium text-black">
                                  Live command transcript
                                </span>
                                <span className="font-mono text-[11px] text-neutral-500 truncate">
                                  {activeWorkflow.citedDoc}
                                </span>
                              </div>
                              <div className="space-y-1.5 text-[12px]">
                                {activeWorkflow.transcript.map((line, i) => {
                                  const isSpoken =
                                    activeWorkflow.isLive &&
                                    i === liveTranscriptHighlight % activeWorkflow.transcript.length;
                                  return (
                                    <div
                                      key={line.time}
                                      className={`flex items-start gap-2.5 leading-relaxed px-2 py-1 rounded-md transition-colors duration-300 ${
                                        isSpoken ? 'bg-[#F5F5F5] text-black' : 'text-neutral-600'
                                      }`}
                                    >
                                      <span className="font-mono text-[11px] text-neutral-400 tabular-nums shrink-0 mt-0.5">
                                        {line.time}
                                      </span>
                                      <span>{line.line}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Action Items Card with Spring Checkmarks */}
                            <div className="bg-white border border-black/[0.07] rounded-xl p-4 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-black">
                                  Action items · {activeWorkflow.actions.length}
                                </span>
                                <span className="text-[11px] text-neutral-500">
                                  {activeWorkflow.department}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {activeWorkflow.actions.map((act) => {
                                  const checked = Boolean(completedActionIds[act.id]);
                                  return (
                                    <button
                                      key={act.id}
                                      type="button"
                                      onClick={() =>
                                        setCompletedActionIds((prev) => ({
                                          ...prev,
                                          [act.id]: !prev[act.id],
                                        }))
                                      }
                                      className="w-full text-left flex items-center gap-2.5 py-1.5 px-1.5 rounded-md hover:bg-[#F7F7F7] transition-colors cursor-pointer"
                                    >
                                      <span
                                        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                                          checked
                                            ? 'bg-black border-black text-white'
                                            : 'bg-white border-neutral-300'
                                        }`}
                                      >
                                        <motion.span
                                          initial={false}
                                          animate={{ scale: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
                                          transition={ARIXO_SNAPPY_SPRING}
                                        >
                                          <Check className="w-3 h-3" />
                                        </motion.span>
                                      </span>
                                      <span
                                        className={`text-[12px] transition-colors ${
                                          checked ? 'text-neutral-400 line-through' : 'text-black'
                                        }`}
                                      >
                                        {act.text}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Governance Verification Card with Animated ScaleX Bars */}
                            <div className="bg-white border border-black/[0.07] rounded-xl p-4 space-y-2.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-black">Workflow verification</span>
                                <span className="text-[11px] text-neutral-500">
                                  RBAC · Tenant isolated
                                </span>
                              </div>
                              <div className="space-y-2">
                                {activeWorkflow.checks.map((chk, idx) => (
                                  <div
                                    key={chk.label}
                                    className="grid grid-cols-12 items-center gap-3 text-[11px]"
                                  >
                                    <span className="col-span-5 text-neutral-600">{chk.label}</span>
                                    <div className="col-span-5 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                                      <motion.div
                                        initial={{ scaleX: 0 }}
                                        animate={{ scaleX: chk.percent / 100 }}
                                        transition={{
                                          duration: 0.65,
                                          delay: idx * 0.08,
                                          ease: ARIXO_EASE,
                                        }}
                                        style={{ transformOrigin: 'left center' }}
                                        className="h-full w-full bg-black rounded-full"
                                      />
                                    </div>
                                    <span className="col-span-2 text-right font-mono text-black whitespace-nowrap">
                                      {chk.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </ScrollTiltFrame>
              </div>
            </section>

            {/* 2. INFINITE CLIENT LOGO MARQUEE TICKER (Exact Arixo continuous marquee) */}
            <section className="py-10 px-6 sm:px-12 border-y border-black/[0.07] bg-white">
              <div className="max-w-[1280px] mx-auto flex flex-col items-center gap-5 text-center">
                <p className="text-[13px] text-neutral-500">
                  Trusted by operations leads from modern teams
                </p>
                <InfiniteLogoTicker />
              </div>
            </section>

            {/* 3. PROBLEM SECTION — LEFT-ALIGNED HEADING + 3 LIVING ANIMATED BENTO CARDS */}
            <section className="py-20 sm:py-28 px-6 sm:px-12 bg-white">
              <div className="max-w-[1280px] mx-auto">
                <ScrollReveal className="max-w-[740px] mb-14 space-y-4">
                  <h2
                    className="font-display font-medium tracking-[-0.04em] leading-[1.06] text-black [text-wrap:balance]"
                    style={{ fontSize: 'clamp(2.25rem, 4.6vw, 3.75rem)' }}
                  >
                    Your workflows are running you<span className="text-black">.</span>
                    <br />
                    Not the other way around<span className="text-black">.</span>
                  </h2>
                  <p className="text-base sm:text-[17px] text-neutral-600 leading-relaxed max-w-[540px]">
                    Every team loses hours translating spoken decisions into manual tickets, policy checks, and follow-up pings.
                  </p>
                </ScrollReveal>

                {/* 3 Living Animated Bento Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <ScrollReveal delay={0.05} className="flex flex-col gap-5">
                    <ProblemCardTranscript />
                    <div className="space-y-2">
                      <h3 className="font-display text-[20px] font-medium tracking-[-0.02em] text-black">
                        Never miss what was said
                      </h3>
                      <p className="text-[14px] text-neutral-600 leading-relaxed">
                        The moment you stop to type tickets manually, half the decision disappears. Flowstate captures spoken instructions cleanly as they happen.
                      </p>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal delay={0.14} className="flex flex-col gap-5">
                    <ProblemCardOwnership />
                    <div className="space-y-2">
                      <h3 className="font-display text-[20px] font-medium tracking-[-0.02em] text-black">
                        Walk out knowing who owns what
                      </h3>
                      <p className="text-[14px] text-neutral-600 leading-relaxed">
                        Every workflow leaves with explicit department routing and approval owners — no more hunting across chat threads two weeks later.
                      </p>
                    </div>
                  </ScrollReveal>

                  <ScrollReveal delay={0.23} className="flex flex-col gap-5">
                    <ProblemCardAsyncBrief />
                    <div className="space-y-2">
                      <h3 className="font-display text-[20px] font-medium tracking-[-0.02em] text-black">
                        No more “what did I miss?”
                      </h3>
                      <p className="text-[14px] text-neutral-600 leading-relaxed">
                        Whoever was not in the room gets the full transcript, cited runbook, department owners, and audit receipt — never three vague bullet points.
                      </p>
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </section>

            {/* 4. FEATURES SECTION — SCROLL-SYNCED STICKY LEFT ACCORDION + LIVING RIGHT SHOWCASES */}
            <section
              id="features"
              className="py-20 sm:py-28 px-6 sm:px-12 border-t border-black/[0.07] bg-white"
            >
              <div className="max-w-[1280px] mx-auto">
                <ScrollReveal className="max-w-[680px] mb-16 space-y-3">
                  <h2
                    className="font-display font-medium tracking-[-0.04em] leading-[1.06] text-black [text-wrap:balance]"
                    style={{ fontSize: 'clamp(2.25rem, 4.6vw, 3.75rem)' }}
                  >
                    Everything your operations need<span className="text-black">.</span>
                  </h2>
                  <p className="text-base sm:text-[17px] text-neutral-600 leading-relaxed">
                    Four tools. One workspace. All delivered in under 30 seconds after you speak.
                  </p>
                </ScrollReveal>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                  {/* Sticky Left Accordion with Scroll-Spy & Sliding Active Indicator */}
                  <div className="lg:col-span-5 lg:sticky lg:top-28 divide-y divide-black/[0.08] border-y border-black/[0.08]">
                    {ARIXO_FEATURES.map((feat, idx) => {
                      const isOpen = openFeatureId === feat.id;
                      return (
                        <div key={feat.id} className="relative py-5 pl-4">
                          {isOpen && (
                            <motion.span
                              layoutId="featureActiveRail"
                              transition={ARIXO_SNAPPY_SPRING}
                              className="absolute left-0 top-4 bottom-4 w-[2px] bg-black rounded-full"
                            />
                          )}
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            onClick={() => handleSelectFeatureAccordion(feat.id)}
                            className="w-full flex items-center justify-between gap-4 text-left cursor-pointer group"
                          >
                            <div className="flex items-baseline gap-3">
                              <span
                                className={`font-mono text-[11px] tabular-nums transition-colors ${
                                  isOpen ? 'text-black' : 'text-neutral-400'
                                }`}
                              >
                                0{idx + 1}
                              </span>
                              <span
                                className={`font-display text-[17px] font-medium tracking-[-0.02em] transition-colors ${
                                  isOpen ? 'text-black' : 'text-neutral-500 group-hover:text-black'
                                }`}
                              >
                                {feat.accordionTitle}
                              </span>
                            </div>
                            <motion.span
                              animate={{ rotate: isOpen ? 45 : 0 }}
                              transition={{ duration: 0.22, ease: ARIXO_EASE }}
                              className={`shrink-0 ${
                                isOpen ? 'text-black' : 'text-neutral-400 group-hover:text-black'
                              }`}
                            >
                              <Plus className="w-4 h-4" />
                            </motion.span>
                          </button>
                          <SmoothAccordionBody isOpen={isOpen}>
                            <p className="pt-3 pl-7 pr-6 text-[14px] text-neutral-600 leading-relaxed">
                              {feat.accordionBody}
                            </p>
                          </SmoothAccordionBody>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: 4 Living Interactive Feature Visuals */}
                  <div className="lg:col-span-7 space-y-16">
                    {ARIXO_FEATURES.map((feat) => (
                      <ScrollReveal key={feat.id} y={32} className="scroll-mt-32">
                        <div
                          id={feat.anchor}
                          data-feature-id={feat.id}
                          ref={(el) => {
                            featureCardRefs.current[feat.id] = el;
                          }}
                          className="space-y-5"
                        >
                          {feat.visualType === 'voice' && <FeatureVisualVoice />}
                          {feat.visualType === 'rag' && <FeatureVisualRag />}
                          {feat.visualType === 'approvals' && (
                            <FeatureVisualApprovals onRegister={onRegister} />
                          )}
                          {feat.visualType === 'exports' && <FeatureVisualExports />}

                          <div className="space-y-1.5 max-w-xl">
                            <h3 className="font-display text-[20px] font-medium tracking-[-0.02em] text-black">
                              {feat.cardTitle}
                            </h3>
                            <p className="text-[14px] text-neutral-600 leading-relaxed">
                              {feat.cardSubtitle}
                            </p>
                          </div>
                        </div>
                      </ScrollReveal>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* 5. HOW IT WORKS — ANIMATED HORIZONTAL LINE + STAGGERED 3-STEP EDITORIAL SEQUENCE */}
            <section
              id="how-it-works"
              className="py-20 sm:py-28 px-6 sm:px-12 border-t border-black/[0.07] bg-white"
            >
              <div className="max-w-[1280px] mx-auto">
                <ScrollReveal className="max-w-[680px] mb-14 space-y-3">
                  <h2
                    className="font-display font-medium tracking-[-0.04em] leading-[1.06] text-black [text-wrap:balance]"
                    style={{ fontSize: 'clamp(2.25rem, 4.6vw, 3.75rem)' }}
                  >
                    Three steps<span className="text-black">.</span> Then forget about it
                    <span className="text-black">.</span>
                  </h2>
                  <p className="text-base sm:text-[17px] text-neutral-600 leading-relaxed">
                    Set up once. Flowstate handles every operational workflow from there.
                  </p>
                </ScrollReveal>

                {/* Drawing Hairline Progress Rule */}
                <div className="relative h-px bg-black/[0.08] mb-10 overflow-hidden">
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.95, ease: ARIXO_EASE }}
                    style={{ transformOrigin: 'left center' }}
                    className="absolute inset-0 bg-black"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-12">
                  {HOW_IT_WORKS_STEPS.map((step, idx) => (
                    <ScrollReveal
                      key={step.num}
                      delay={idx * 0.12}
                      className="group flex flex-col justify-between gap-6"
                    >
                      <div className="space-y-4">
                        <div className="font-mono text-[14px] font-medium text-black tabular-nums">
                          {step.num}
                        </div>
                        <h3 className="font-display text-[20px] font-medium tracking-[-0.02em] text-black">
                          {step.title}
                        </h3>
                        <p className="text-[14px] text-neutral-600 leading-relaxed">
                          {step.body}
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1.5 text-[13px] font-medium text-black">
                        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                        <span>{step.foot}</span>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>
            </section>

            {/* 6. SOCIAL PROOF / TESTIMONIALS — STAGGERED 3-COLUMN MASONRY WITH PORTRAIT STORIES */}
            <section
              id="testimonials"
              className="py-20 sm:py-28 px-6 sm:px-12 border-t border-black/[0.07] bg-white"
            >
              <div className="max-w-[1280px] mx-auto">
                <ScrollReveal className="max-w-[680px] mb-14 space-y-3">
                  <h2
                    className="font-display font-medium tracking-[-0.04em] leading-[1.06] text-black [text-wrap:balance]"
                    style={{ fontSize: 'clamp(2.25rem, 4.6vw, 3.75rem)' }}
                  >
                    What teams say<span className="text-black">.</span>
                  </h2>
                  <p className="text-base sm:text-[17px] text-neutral-600 leading-relaxed">
                    How engineering, security, and operations leaders turn spoken instructions into audited execution.
                  </p>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  {TESTIMONIAL_COLUMNS.map((col, colIdx) => (
                    <div key={colIdx} className="flex flex-col gap-6">
                      {col.map((item, rowIdx) => (
                        <ScrollReveal key={item.id} delay={colIdx * 0.08 + rowIdx * 0.06}>
                          {item.videoImage ? (
                            <motion.button
                              type="button"
                              whileHover={{ y: -4 }}
                              transition={ARIXO_SNAPPY_SPRING}
                              onClick={() => setActiveStoryModal(item)}
                              className="group relative w-full h-[420px] rounded-2xl overflow-hidden border border-black/[0.08] text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                            >
                              <img
                                src={item.videoImage}
                                alt={item.videoAlt || item.name}
                                referrerPolicy="no-referrer"
                                className="absolute inset-0 w-full h-full object-cover grayscale group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                                  <Play className="w-5 h-5 fill-black ml-0.5" />
                                </span>
                              </div>

                              <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                                <div className="text-sm font-medium">{item.name}</div>
                                <div className="text-xs text-white/75 mt-0.5">{item.role}</div>
                              </div>
                            </motion.button>
                          ) : (
                            <motion.figure
                              whileHover={{ y: -3 }}
                              transition={ARIXO_SNAPPY_SPRING}
                              className="rounded-2xl border border-black/[0.07] bg-[#F7F7F7] hover:bg-[#F3F3F3] transition-colors p-6 sm:p-7 flex flex-col justify-between gap-6"
                            >
                              <blockquote className="text-[14px] text-neutral-800 leading-relaxed">
                                “{item.quote}”
                              </blockquote>
                              <figcaption className="pt-4 border-t border-black/[0.08]">
                                <div className="text-[14px] font-medium text-black">
                                  {item.name}
                                </div>
                                <div className="text-[12px] text-neutral-500 mt-0.5">
                                  {item.role}
                                </div>
                              </figcaption>
                            </motion.figure>
                          )}
                        </ScrollReveal>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Animated Extra Testimonials Expansion */}
                <AnimatePresence>
                  {showMoreTestimonials && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: ARIXO_EASE }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                        {EXTRA_TESTIMONIALS.map((item, idx) => (
                          <motion.figure
                            key={item.id}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.4,
                              delay: idx * 0.07,
                              ease: ARIXO_EASE,
                            }}
                            className="rounded-2xl border border-black/[0.07] bg-[#F7F7F7] p-6 sm:p-7 flex flex-col justify-between gap-6"
                          >
                            <blockquote className="text-[14px] text-neutral-800 leading-relaxed">
                              “{item.quote}”
                            </blockquote>
                            <figcaption className="pt-4 border-t border-black/[0.08]">
                              <div className="text-[14px] font-medium text-black">{item.name}</div>
                              <div className="text-[12px] text-neutral-500 mt-0.5">
                                {item.role}
                              </div>
                            </figcaption>
                          </motion.figure>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-10 flex justify-center">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={ARIXO_SNAPPY_SPRING}
                    onClick={() => setShowMoreTestimonials((v) => !v)}
                    className="px-5 py-2.5 rounded-lg border border-black/15 bg-white hover:border-black text-[13px] font-medium text-black transition-colors cursor-pointer"
                  >
                    {showMoreTestimonials ? 'Show less' : 'View More'}
                  </motion.button>
                </div>
              </div>
            </section>

            {/* 7. BLOG SECTION — 4 FULL EDITORIAL BLOGS WITH SLIDING CATEGORY TABS (NO PRICING) */}
            <section
              id="blog"
              className="py-20 sm:py-28 px-6 sm:px-12 border-t border-black/[0.07] bg-white"
            >
              <div className="max-w-[1280px] mx-auto">
                <ScrollReveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                  <div className="max-w-[640px] space-y-3">
                    <h2
                      className="font-display font-medium tracking-[-0.04em] leading-[1.06] text-black [text-wrap:balance]"
                      style={{ fontSize: 'clamp(2.25rem, 4.6vw, 3.75rem)' }}
                    >
                      Blog<span className="text-black">.</span>
                    </h2>
                    <p className="text-base sm:text-[17px] text-neutral-600 leading-relaxed">
                      Practical ideas on voice automation, grounded runbooks, approval governance, and building better systems for growing teams.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateSubPage({ view: 'blog' })}
                    className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-black hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Open blog archive</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </button>
                </ScrollReveal>

                {/* Animated Category Filter Tabs with Sliding Black Indicator */}
                <div
                  role="tablist"
                  aria-label="Filter blog articles"
                  className="flex flex-wrap items-center gap-2 mb-10"
                >
                  {BLOG_CATEGORIES.map((category) => {
                    const active = homeBlogCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setHomeBlogCategory(category)}
                        className={`relative px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'text-white'
                            : 'bg-[#F5F5F5] text-neutral-700 hover:bg-neutral-200 hover:text-black'
                        }`}
                      >
                        {active && (
                          <motion.span
                            layoutId="homeBlogActiveTab"
                            transition={ARIXO_SNAPPY_SPRING}
                            className="absolute inset-0 bg-black rounded-lg"
                          />
                        )}
                        <span className="relative z-10">{category}</span>
                      </button>
                    );
                  })}
                </div>

                {/* 2x2 Animated Editorial Blog Grid */}
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <AnimatePresence mode="popLayout">
                    {filteredHomeBlogs.map((post, idx) => (
                      <motion.article
                        key={post.slug}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        viewport={{ once: true, amount: 0.12 }}
                        transition={{
                          duration: 0.45,
                          delay: idx * 0.06,
                          ease: ARIXO_EASE,
                        }}
                        className="group rounded-2xl border border-black/[0.08] bg-white overflow-hidden hover:border-black transition-colors duration-200 flex flex-col"
                      >
                        <button
                          type="button"
                          onClick={() => navigateSubPage({ view: 'blog-post', slug: post.slug })}
                          className="text-left flex flex-col flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                        >
                          <div className="overflow-hidden bg-[#F7F7F7] border-b border-black/[0.07]">
                            <BlogEditorialImage
                              src={post.coverImage}
                              alt={post.coverAlt}
                              title={post.title}
                              className="w-full aspect-[4/3] object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                            />
                          </div>

                          <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between">
                            <div>
                              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                                <span className="font-medium text-black">{post.category}</span>
                                <span aria-hidden="true">·</span>
                                <span>{post.date}</span>
                                <span aria-hidden="true">·</span>
                                <span>{post.readTime}</span>
                              </div>

                              <h3 className="font-display text-xl sm:text-[22px] font-medium tracking-[-0.025em] text-black leading-snug mb-3 group-hover:underline decoration-1 underline-offset-4 [text-wrap:balance]">
                                {post.title}
                              </h3>

                              <p className="text-[14px] text-neutral-600 leading-relaxed mb-6">
                                {post.excerpt}
                              </p>
                            </div>

                            <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between text-xs">
                              <span className="text-neutral-600">
                                <strong className="font-medium text-black">
                                  {post.author.name}
                                </strong>{' '}
                                · {post.author.role}
                              </span>
                              <span className="inline-flex items-center gap-1 font-medium text-black shrink-0">
                                <span>Read</span>
                                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              </span>
                            </div>
                          </div>
                        </button>
                      </motion.article>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </section>

            {/* 8. FAQ SECTION — SILKY FRAMER MOTION ACCORDION */}
            <section
              id="faq"
              className="py-20 sm:py-28 px-6 sm:px-12 border-t border-black/[0.07] bg-white"
            >
              <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <ScrollReveal className="lg:col-span-5 space-y-3">
                  <h2
                    className="font-display font-medium tracking-[-0.04em] leading-[1.06] text-black [text-wrap:balance]"
                    style={{ fontSize: 'clamp(2.25rem, 4.4vw, 3.5rem)' }}
                  >
                    Questions people actually ask<span className="text-black">.</span>
                  </h2>
                  <p className="text-base text-neutral-600 leading-relaxed">
                    If something’s still unclear,{' '}
                    <button
                      type="button"
                      onClick={() => navigateSubPage({ view: 'contact' })}
                      className="font-medium text-black underline underline-offset-4 hover:text-neutral-700 cursor-pointer"
                    >
                      we’re one message away
                    </button>
                    .
                  </p>
                </ScrollReveal>

                <ScrollReveal
                  delay={0.1}
                  className="lg:col-span-7 divide-y divide-black/[0.08] border-y border-black/[0.08]"
                >
                  {FAQ_ITEMS.map((item, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div key={item.q}>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                          className="w-full py-5 flex items-center justify-between gap-4 text-left cursor-pointer group"
                        >
                          <span className="font-display text-[17px] font-medium text-black group-hover:text-neutral-700 transition-colors">
                            {item.q}
                          </span>
                          <motion.span
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            transition={{ duration: 0.22, ease: ARIXO_EASE }}
                            className="text-black shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </motion.span>
                        </button>
                        <SmoothAccordionBody isOpen={isOpen}>
                          <div className="pb-6 pr-8 text-[14px] text-neutral-600 leading-relaxed">
                            {item.a}
                          </div>
                        </SmoothAccordionBody>
                      </div>
                    );
                  })}
                </ScrollReveal>
              </div>
            </section>

            {/* 9. FINAL CONVERSION BANNER (Architectural Monochrome Frame + Scroll Reveal) */}
            <section className="py-24 sm:py-32 px-6 sm:px-12 border-t border-black/[0.07] bg-white">
              <div className="max-w-[1280px] mx-auto">
                <ScrollReveal>
                  <div className="rounded-3xl border border-black/[0.08] bg-[#F7F7F7] px-6 sm:px-14 py-16 sm:py-24 flex flex-col items-center text-center">
                    <h2
                      className="font-display font-medium tracking-[-0.045em] leading-[1.04] text-black mb-5 max-w-2xl [text-wrap:balance]"
                      style={{ fontSize: 'clamp(2.35rem, 5vw, 4.25rem)' }}
                    >
                      Your next workflow starts in a few minutes
                      <span className="text-black">.</span>
                    </h2>
                    <p className="text-base sm:text-[17px] text-neutral-600 leading-relaxed max-w-xl mb-9">
                      Flowstate captures your command, grounds it in your playbooks, and delivers structured workflows, tasks, and approvals — before you even close the tab.
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-3 mb-5">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        transition={ARIXO_SNAPPY_SPRING}
                        onClick={onRegister}
                        className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-black hover:bg-neutral-800 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Start for free</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </motion.button>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        transition={ARIXO_SNAPPY_SPRING}
                        onClick={onOpenWaitlist}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-white hover:bg-neutral-100 text-black border border-black/15 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Join early access waitlist</span>
                      </motion.button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                        No credit card required
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Set up in 60 seconds</span>
                      <span aria-hidden="true">·</span>
                      <span>Zero synthetic demo data</span>
                    </div>
                  </div>
                </ScrollReveal>
              </div>
            </section>
          </main>
        )}

        {/* Animated Testimonial Story Modal (Arixo Video/Story Dialog) */}
        <AnimatePresence>
          {activeStoryModal && (
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="story-modal-title"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveStoryModal(null)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.28, ease: ARIXO_EASE }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl rounded-2xl border border-black/10 bg-white text-black shadow-2xl overflow-hidden"
              >
                <div className="relative h-64 sm:h-72 bg-black">
                  {activeStoryModal.videoImage && (
                    <img
                      src={activeStoryModal.videoImage}
                      alt={activeStoryModal.videoAlt || activeStoryModal.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover grayscale opacity-85"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <button
                    type="button"
                    onClick={() => setActiveStoryModal(null)}
                    aria-label="Close customer story"
                    className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-5 left-6 right-6 text-white">
                    <div id="story-modal-title" className="font-display text-xl font-medium">
                      {activeStoryModal.name}
                    </div>
                    <div className="text-xs text-white/75 mt-0.5">{activeStoryModal.role}</div>
                  </div>
                </div>
                <div className="p-6 sm:p-8 space-y-6">
                  <blockquote className="text-base sm:text-lg text-black leading-relaxed font-normal">
                    “{activeStoryModal.quote}”
                  </blockquote>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/[0.08]">
                    <span className="text-xs text-neutral-500">
                      Verified Flowstate operations deployment
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveStoryModal(null);
                        onRegister();
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-medium transition-colors cursor-pointer"
                    >
                      <span>Create workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer (All links wired, NO Pricing) */}
        <Footer
          onSignIn={onSignIn}
          onRegister={onRegister}
          onOpenWaitlist={onOpenWaitlist}
          onInstallPwa={onInstallPwa}
          onNavigateHomeSection={navigateHomeSection}
          onOpenBlog={() => navigateSubPage({ view: 'blog' })}
          onOpenContact={() => navigateSubPage({ view: 'contact' })}
        />
      </div>
    </MotionConfig>
  );
};
