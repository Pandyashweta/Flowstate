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
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Download,
  Folder,
  GitBranch,
  Home,
  Menu,
  Mic,
  Play,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
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
      { time: '0:44', line: 'That works - lock that workflow and export the CSV audit receipt once approved.' },
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
    title: 'Weekly Standup - Engineering',
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
    title: 'Vendor Onboarding - Legal Gate',
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
    accordionTitle: 'Workflows & Tasks',
    accordionBody:
      'Create repeatable operational workflows, assign task owners and priorities, and track execution status across personal and professional work.',
    cardTitle: 'Workflows & Tasks',
    cardSubtitle:
      'Organize personal and team tasks alongside structured multi-step workflows.',
    visualType: 'voice' as const,
  },
  {
    id: 'feature-2',
    anchor: 'feature-2',
    accordionTitle: 'Knowledge Base',
    accordionBody:
      'Upload PDF, DOCX, and TXT playbooks into your workspace Knowledge Base so your team always has searchable runbooks and SOPs.',
    cardTitle: 'Centralized Knowledge Base',
    cardSubtitle:
      'Keep your SOPs, policies, and operational documents indexed and searchable in one place.',
    visualType: 'rag' as const,
  },
  {
    id: 'feature-3',
    anchor: 'feature-3',
    accordionTitle: 'Human Approval Gates',
    accordionBody:
      'High-impact steps pause automatically in the Approvals Queue for Owner, Admin, or Manager sign-off under strict 5-tier RBAC boundaries.',
    cardTitle: 'Every sensitive task, human-approved',
    cardSubtitle:
      'Keep full velocity without risking silent actions. Reviewers inspect every detail before approving.',
    visualType: 'approvals' as const,
  },
  {
    id: 'feature-4',
    anchor: 'feature-4',
    accordionTitle: 'Workspaces & Audit Exports',
    accordionBody:
      'Manage personal and professional work in a clean workspace, track analytics, and download complete audit trails in CSV, JSON, or TXT anytime.',
    cardTitle: 'Clean workspaces & audit exports',
    cardSubtitle:
      'Track execution analytics and export immutable records in open formats anytime.',
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
        'I used to split my attention between leading incident calls and typing tickets afterward - and ended up doing both badly. Now I stay present and walk out with grounded workflows and clear owners.',
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
        'Stand-ups, vendor reviews, access audits - every single one gets the same treatment. Voice capture, runbook grounding, Owner approval, exportable receipt. It saves us hours every week.',
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
    a: 'Yes - one account lets you keep a private Personal workspace while creating or joining multiple Organization workspaces with user-created departments and strict tenant isolation.',
  },
  {
    q: 'How does Flowstate ground workflows in my internal policies?',
    a: 'Upload PDF, DOCX, or TXT playbooks into your workspace Knowledge Base. Our Python RAG backend extracts document text, retrieves relevant policy passages, and cites them directly inside every drafted workflow.',
  },
  {
    q: 'Do sensitive workflows run without human authorization?',
    a: 'No - sensitive steps automatically pause inside the Approvals Queue so Owners, Admins, or Managers can review the full prompt, steps, and cited runbook before clicking Approve or Reject.',
  },
  {
    q: 'How does the AI Command Center work?',
    a: 'Powered by our Python AI backend, the Command Center turns natural-language or voice directives into structured workflows, tasks, and operational insights - using Gemini when configured or the built-in Python engine out of the box.',
  },
  {
    q: 'Do new workspaces come filled with fake demo data, and can I export audit logs?',
    a: 'Every new workspace starts completely clean with zero pre-made tasks or synthetic records. Authorized roles can export full audit histories anytime in CSV, JSON, or TXT formats from Settings or Analytics.',
  },
];

const HOW_IT_WORKS_STEPS = [
  {
    num: '01',
    title: 'Set up your workspace',
    body: 'Create a clean workspace for personal and professional work. Organize your groups and upload PDF, DOCX, or TXT playbooks.',
    foot: 'Takes 60 seconds',
  },
  {
    num: '02',
    title: 'Organize workflows & tasks',
    body: 'Build repeatable workflows, assign task owners, and track progress across your personal and work queues.',
    foot: 'Clear ownership',
  },
  {
    num: '03',
    title: 'Approve & export anytime',
    body: 'Review sensitive actions inside the Approvals Queue before execution - then export verifiable CSV, JSON, and TXT audit trails.',
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

        {/* MAIN HOME PAGE - KINETIC ARIXO EDITORIAL ARCHITECTURE (PURE WHITE, BLACK FONT, BLACK DOT) */}
        {subPage.view === 'home' && (
          <main className="flex-1 bg-white text-black">
            {/* 1. HERO SECTION - LEFT-ALIGNED MASKED REVEAL + SCROLL-TILT 3-PANE LIVING APP SCREEN */}
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
                    <span>Personal &amp; Professional Workspace</span>
                  </motion.div>

                  {/* Masked Line-by-Line Editorial Display Headline with Signature Black Dot */}
                  <h1
                    className="font-display font-medium tracking-[-0.045em] leading-[1.03] text-black [text-wrap:balance]"
                    style={{ fontSize: 'clamp(2.85rem, 6.2vw, 5.25rem)' }}
                  >
                    <MaskedHeadlineLine delay={0.1}>Organize your</MaskedHeadlineLine>
                    <MaskedHeadlineLine delay={0.19}>
                      workflows and tasks<span className="text-black">.</span>
                    </MaskedHeadlineLine>
                  </h1>

                  {/* Concise Left-Aligned Subheadline */}
                  <motion.p
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.28, ease: ARIXO_EASE }}
                    className="text-base sm:text-[18px] text-neutral-600 font-normal leading-[1.55] max-w-[540px]"
                  >
                    Manage personal and professional tasks, structured workflows, knowledge base documents, and approvals in one clean dashboard.
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
                    {false && (
                      <button
                        type="button"
                        onClick={onInstallPwa}
                        className="inline-flex items-center gap-1.5 px-3.5 py-3 rounded-lg text-neutral-600 hover:text-black text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Install app</span>
                      </button>
                    )}
                  </motion.div>
                </div>

                {/* FLOWSTATE MAIN DASHBOARD INTERACTIVE SHOWCASE */}
                <ScrollTiltFrame className="w-full mt-4">
                  <div className="w-full rounded-2xl border border-black/[0.09] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.045),0_28px_84px_rgba(0,0,0,0.08)] overflow-hidden">
                    {/* Browser Header Bar */}
                    <div className="h-10 px-4 border-b border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-black" />
                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                      </div>
                      <div className="px-4 py-1 rounded-md bg-white border border-[#E5E5E5] text-[11px] font-mono text-neutral-500">
                        app.flowstate.ai / overview
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-neutral-500 tabular-nums">
                        <CompactAudioVisualizer bars={4} height={10} active />
                        <span>{formatLiveElapsed(liveSeconds)}</span>
                      </div>
                    </div>

                    {/* Real Flowstate App Shell: Sidebar + TopBar + DashboardView */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[540px] text-left">
                      {/* Left Software Sidebar */}
                      <aside className="hidden lg:flex lg:col-span-3 border-r border-[#E5E5E5] bg-[#FAFAFA] flex-col justify-between select-none">
                        <div>
                          {/* Workspace Header */}
                          <div className="h-11 px-3 flex items-center justify-between border-b border-[#E5E5E5]">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src="/icons/favicon_io/apple-touch-icon.png"
                                alt="FLOWSTATE"
                                className="w-6 h-6 rounded-md object-cover shrink-0"
                              />
                              <span className="font-display font-semibold text-xs text-[#111111] truncate">
                                Acme Operations
                              </span>
                            </div>
                            <ChevronDown className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                          </div>

                          {/* + New workflow */}
                          <div className="p-2.5">
                            <button
                              type="button"
                              onClick={onRegister}
                              className="w-full flex items-center gap-2 rounded-md border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-[#111111] text-[11px] font-medium px-2.5 py-1.5 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#525252]" />
                              <span>New workflow</span>
                            </button>
                          </div>

                          {/* Main Nav */}
                          <nav className="px-2 space-y-0.5">
                            {[
                              { id: 'All', label: 'Home', icon: Home, active: sidebarFilter === 'All' },
                              { id: 'Security', label: 'Workflows', icon: GitBranch, active: sidebarFilter === 'Security' },
                              { id: 'Engineering', label: 'Tasks', icon: CheckSquare, active: sidebarFilter === 'Engineering' },
                              { id: 'KB', label: 'Knowledge Base', icon: BookOpen, active: false },
                              { id: 'Approvals', label: 'Approvals', icon: ShieldCheck, badge: 3, active: sidebarFilter === 'Approvals' },
                              { id: 'Analytics', label: 'Analytics', icon: BarChart3, active: false },
                            ].map((item) => {
                              const NavIcon = item.icon;
                              return (
                                <button
                                  key={item.label}
                                  type="button"
                                  onClick={() => {
                                    if (item.id === 'All' || item.id === 'Security' || item.id === 'Engineering' || item.id === 'Approvals') {
                                      setSidebarFilter(item.id);
                                    }
                                  }}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] transition-colors cursor-pointer ${
                                    item.active
                                      ? 'bg-[#ECECEC] text-[#111111] font-semibold'
                                      : 'text-[#525252] hover:bg-[#F2F2F2] font-medium'
                                  }`}
                                >
                                  <NavIcon className={`w-3.5 h-3.5 shrink-0 ${item.active ? 'text-[#111111]' : 'text-[#737373]'}`} />
                                  <span className="truncate flex-1 text-left">{item.label}</span>
                                  {item.badge !== undefined && (
                                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-[#111111] text-white tabular-nums font-semibold leading-none">
                                      {item.badge}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </nav>

                          {/* Departments */}
                          <div className="px-2 mt-4">
                            <div className="px-2 mb-1 text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-wider">
                              Departments
                            </div>
                            <div className="space-y-0.5">
                              {['Customer Support', 'IT Operations', 'Billing & Finance'].map((dept) => (
                                <div
                                  key={dept}
                                  className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[11px] text-[#525252]"
                                >
                                  <Folder className="w-3.5 h-3.5 text-[#737373] shrink-0" />
                                  <span className="truncate">{dept}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Bottom Settings + Role Pill */}
                        <div>
                          <div className="border-t border-[#E5E5E5] px-2 py-1.5">
                            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] text-[#525252] font-medium">
                              <Settings className="w-3.5 h-3.5 text-[#737373]" />
                              <span>Settings</span>
                            </div>
                          </div>
                          <div className="px-3 pb-2.5 pt-1.5 border-t border-[#E5E5E5] flex items-center justify-between">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F2F2F2] text-[10px] font-medium text-[#525252]">
                              <span>Business</span>
                              <span className="text-[#A3A3A3]">· Owner</span>
                            </span>
                          </div>
                        </div>
                      </aside>

                      {/* Right Software Main Content (TopBar + DashboardView) */}
                      <div className="lg:col-span-9 bg-[#FAFAFA] flex flex-col">
                        {/* Software TopBar */}
                        <div className="h-11 px-4 border-b border-[#E5E5E5] bg-white flex items-center justify-between gap-3">
                          <span className="font-display font-semibold text-xs text-[#111111]">
                            Home
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#E5E5E5] bg-[#FAFAFA] text-[11px] text-[#737373] w-44">
                              <Search className="w-3 h-3 shrink-0" />
                              <input
                                type="text"
                                value={heroSearch}
                                onChange={(e) => setHeroSearch(e.target.value)}
                                aria-label="Search demo workflows"
                                placeholder="Search workflows..."
                                className="bg-transparent text-[11px] text-[#111111] placeholder:text-[#737373] focus:outline-none w-full"
                              />
                            </div>
                            <div className="w-6 h-6 rounded-full bg-[#111111] text-white text-[10px] font-bold flex items-center justify-center">
                              AO
                            </div>
                          </div>
                        </div>

                        {/* Dashboard Body */}
                        <div className="p-4 sm:p-5 space-y-4 flex-1">
                          {/* Workspace Header */}
                          <div className="rounded-xl border border-[#E5E5E5] bg-white p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <h3 className="font-display text-sm sm:text-base font-bold text-[#111111]">
                                Welcome back, Alex
                              </h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={onRegister}
                                className="px-3 py-1.5 rounded-lg bg-[#111111] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>New Workflow</span>
                              </button>
                            </div>
                          </div>

                          {/* 4 KPI Metric Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {[
                              { label: 'Active Workflows', value: '5', note: '3 running now' },
                              { label: 'Open Tasks', value: '12', note: '4 due today' },
                              { label: 'Pending Approvals', value: '3', note: 'Owner gate' },
                              { label: 'Success Rate', value: '96%', note: 'Last 30 days' },
                            ].map((kpi) => (
                              <div
                                key={kpi.label}
                                className="rounded-xl border border-[#E5E5E5] bg-white p-3"
                              >
                                <div className="text-[10px] text-[#737373] font-medium">
                                  {kpi.label}
                                </div>
                                <div className="font-display text-lg font-bold text-[#111111] tabular-nums mt-0.5">
                                  {kpi.value}
                                </div>
                                <div className="text-[10px] text-[#737373] font-mono mt-0.5">
                                  {kpi.note}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Workflows & Approvals Split */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                            {/* Active Workflows List */}
                            <div className="md:col-span-7 rounded-xl border border-[#E5E5E5] bg-white p-3.5 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-display text-xs font-semibold text-[#111111]">
                                  Recent Workflows
                                </span>
                                <span className="text-[10px] font-mono text-[#737373]">
                                  {filteredHeroWorkflows.length} shown
                                </span>
                              </div>
                              <div className="space-y-1">
                                {filteredHeroWorkflows.slice(0, 4).map((wf) => {
                                  const selected = wf.id === activeWorkflow.id;
                                  return (
                                    <button
                                      key={wf.id}
                                      type="button"
                                      onClick={() => setSelectedWorkflowId(wf.id)}
                                      className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                        selected
                                          ? 'bg-[#F4F4F4] border border-black/[0.08]'
                                          : 'hover:bg-[#FAFAFA]'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <div className="text-[11px] font-semibold text-[#111111] truncate">
                                          {wf.title}
                                        </div>
                                        <div className="text-[10px] text-[#737373] truncate">
                                          {wf.department} · {wf.citedDoc}
                                        </div>
                                      </div>
                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F2F2F2] text-[#111111] shrink-0">
                                        {wf.statusLabel}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Action Items / Approvals */}
                            <div className="md:col-span-5 rounded-xl border border-[#E5E5E5] bg-white p-3.5 flex flex-col justify-between gap-2.5">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-display text-xs font-semibold text-[#111111]">
                                    Action Items &amp; Approvals
                                  </span>
                                  <span className="text-[10px] font-mono text-[#737373]">
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
                                        className="w-full text-left flex items-center gap-2 py-1 px-1 rounded hover:bg-[#FAFAFA] cursor-pointer"
                                      >
                                        <span
                                          className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 ${
                                            checked ? 'bg-black border-black text-white' : 'bg-white border-neutral-300'
                                          }`}
                                        >
                                          {checked && <Check className="w-2.5 h-2.5" />}
                                        </span>
                                        <span
                                          className={`text-[11px] truncate ${
                                            checked ? 'text-neutral-400 line-through' : 'text-[#111111]'
                                          }`}
                                        >
                                          {act.text}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-[10px]">
                                <span className="text-[#737373] font-mono">
                                  Tasks · Workflows · Audit
                                </span>
                                <button
                                  type="button"
                                  onClick={onRegister}
                                  className="font-semibold text-[#111111] hover:underline cursor-pointer"
                                >
                                  Open workspace →
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollTiltFrame>
              </div>
            </section>

            {/* 2. WHAT FLOWSTATE DOES - 3-STEP EDITORIAL SEQUENCE */}
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

            {/* 3. FEATURES SECTION - CLEAN 2-COLUMN EDITORIAL ACCORDION */}
            <section
              id="features"
              className="py-20 sm:py-28 px-6 sm:px-12 border-t border-black/[0.07] bg-white"
            >
              <div className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <ScrollReveal className="lg:col-span-5 space-y-3">
                  <h2
                    className="font-display font-medium tracking-[-0.04em] leading-[1.06] text-black [text-wrap:balance]"
                    style={{ fontSize: 'clamp(2.25rem, 4.4vw, 3.5rem)' }}
                  >
                    Everything your operations need<span className="text-black">.</span>
                  </h2>
                  <p className="text-base text-neutral-600 leading-relaxed">
                    Four core capabilities built for personal and professional workspaces.
                  </p>
                </ScrollReveal>

                <ScrollReveal
                  delay={0.1}
                  className="lg:col-span-7 divide-y divide-black/[0.08] border-y border-black/[0.08]"
                >
                  {ARIXO_FEATURES.map((feat, idx) => {
                    const isOpen = openFeatureId === feat.id;
                    return (
                      <div key={feat.id}>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          onClick={() => handleSelectFeatureAccordion(feat.id)}
                          className="w-full py-5 flex items-center justify-between gap-4 text-left cursor-pointer group"
                        >
                          <div className="flex items-baseline gap-3">
                            <span className="font-mono text-[11px] tabular-nums text-neutral-400">
                              0{idx + 1}
                            </span>
                            <span className="font-display text-[17px] font-medium text-black group-hover:text-neutral-700 transition-colors">
                              {feat.accordionTitle}
                            </span>
                          </div>
                          <motion.span
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            transition={{ duration: 0.22, ease: ARIXO_EASE }}
                            className="text-black shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </motion.span>
                        </button>
                        <SmoothAccordionBody isOpen={isOpen}>
                          <div className="pb-6 pl-7 pr-8 text-[14px] text-neutral-600 leading-relaxed">
                            {feat.accordionBody}
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
                      Flowstate captures your command, grounds it in your playbooks, and delivers structured workflows, tasks, and approvals - before you even close the tab.
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
