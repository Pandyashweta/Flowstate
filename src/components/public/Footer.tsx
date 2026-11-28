import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import { apiPostPublic } from '../../lib/api';
import { ARIXO_EASE } from './MotionPrimitives';

export interface FooterProps {
  onSignIn: () => void;
  onRegister: () => void;
  onOpenWaitlist: () => void;
  onInstallPwa: () => void;
  onNavigateHomeSection?: (sectionId: string) => void;
  onOpenBlog?: () => void;
  onOpenContact?: () => void;
}

type InfoModalKey = 'about' | 'careers' | 'privacy' | 'terms' | 'cookies';

interface InfoModalSection {
  heading: string;
  body: string;
}

const INFO_MODAL_CONTENT: Record<
  InfoModalKey,
  {
    kicker: string;
    title: string;
    subtitle: string;
    sections: InfoModalSection[];
    ctaLabel?: string;
    ctaAction?: 'waitlist' | 'register';
  }
> = {
  about: {
    kicker: 'Company · About FLOWSTATE',
    title: 'Built for operations teams that move at the speed of speech.',
    subtitle:
      'FLOWSTATE turns spoken and written operational decisions into structured, governed workflows backed by your own playbooks.',
    sections: [
      {
        heading: 'Our Mission',
        body: 'Operations, IT, and engineering leaders spend hours translating incidents and decisions into manual tickets, approvals, and status updates. FLOWSTATE eliminates that translation tax while keeping humans firmly in control of sensitive actions.',
      },
      {
        heading: 'Architecture Principles',
        body: 'Every workspace is strictly tenant-isolated across Personal and Organization environments, with 5-tier role-based access control, grounded document retrieval (RAG), and immutable audit exports in CSV, JSON, and TXT formats.',
      },
      {
        heading: 'Availability',
        body: 'FLOWSTATE is available globally as a browser-native progressive web application with dedicated enterprise rollout tracks opening through our early access waitlist.',
      },
    ],
    ctaLabel: 'Join Early Access Waitlist',
    ctaAction: 'waitlist',
  },
  careers: {
    kicker: 'Company · Careers',
    title: 'Build the operating system for voice-driven enterprise workflows.',
    subtitle:
      'We are a small, high-craft team of systems engineers, product designers, and applied AI researchers.',
    sections: [
      {
        heading: 'Staff Full-Stack Systems Engineer - Remote / SF',
        body: 'Architect multi-tenant workflow orchestration engines, low-latency voice pipelines, and verifiable RBAC governance rails.',
      },
      {
        heading: 'Senior Product Designer - Remote / NYC',
        body: 'Craft calm, high-density enterprise interfaces, voice interaction patterns, and crisp spatial design systems across desktop and mobile.',
      },
      {
        heading: 'Applied AI Engineer (RAG & Tool Calling) - Remote / London',
        body: 'Improve retrieval precision, citation grounding, and structured tool execution over enterprise PDF, DOCX, and Markdown runbooks.',
      },
    ],
    ctaLabel: 'Join Waitlist & Talent Network',
    ctaAction: 'waitlist',
  },
  privacy: {
    kicker: 'Legal · Privacy Policy',
    title: 'Your workspace data stays isolated, encrypted, and yours.',
    subtitle: 'Effective November 2026 · Applies to FLOWSTATE web apps, APIs, and waitlist services.',
    sections: [
      {
        heading: 'Data Collection & Minimization',
        body: 'We collect only the information required to operate your account, workspaces, and waitlist enrollment - such as your email address, workspace configuration, uploaded knowledge documents, and operational audit records.',
      },
      {
        heading: 'Tenant Isolation & AI Grounding',
        body: 'Uploaded runbooks and operational prompts are scoped strictly to your workspace ID and are never shared across organizations or used to train public foundation models.',
      },
      {
        heading: 'Export & Deletion Rights',
        body: 'Workspace Owners can export audit trails anytime in CSV, JSON, or TXT formats and request full account or waitlist email deletion by contacting privacy@flowstate.ai.',
      },
    ],
  },
  terms: {
    kicker: 'Legal · Terms & Conditions',
    title: 'Clear terms for personal and enterprise workspaces.',
    subtitle: 'Effective November 2026 · Governing use of the FLOWSTATE platform.',
    sections: [
      {
        heading: 'Authorized Workspace Use',
        body: 'You are responsible for managing member invitations, role assignments (Owner, Admin, Manager, Member, Viewer), and approval gates within your Organization workspaces.',
      },
      {
        heading: 'Human-in-the-Loop Responsibility',
        body: 'FLOWSTATE provides structured AI workflow proposals and explicit approval queues. Organization reviewers remain responsible for authorizing external integrations and production actions.',
      },
      {
        heading: 'Service Availability & Support',
        body: 'We maintain continuous operational monitoring and provide priority onboarding and SLA commitments to teams enrolled through FLOWSTATE Enterprise.',
      },
    ],
  },
  cookies: {
    kicker: 'Legal · Cookie Policy',
    title: 'Essential cookies only - zero third-party ad tracking.',
    subtitle: 'Effective November 2026 · How FLOWSTATE handles browser storage and sessions.',
    sections: [
      {
        heading: 'Authentication & Security Sessions',
        body: 'We use strictly necessary session tokens and local storage preferences to keep you authenticated, preserve your active workspace selection, and remember your theme preference.',
      },
      {
        heading: 'Offline PWA Caching',
        body: 'When installed as a Progressive Web App, our service worker caches core application assets locally to deliver fast startup and graceful offline behavior.',
      },
      {
        heading: 'No Behavioral Ad Trackers',
        body: 'FLOWSTATE does not embed third-party advertising pixels, cross-site behavioral trackers, or data broker scripts.',
      },
    ],
  },
};

export const Footer: React.FC<FooterProps> = ({
  onSignIn,
  onRegister,
  onOpenWaitlist,
  onInstallPwa,
  onNavigateHomeSection,
  onOpenBlog,
  onOpenContact,
}) => {
  const [activeModal, setActiveModal] = useState<InfoModalKey | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [joinedSpot, setJoinedSpot] = useState<{ position: number; email: string } | null>(null);

  useEffect(() => {
    if (!activeModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeModal]);

  const handleQuickWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const trimmed = waitlistEmail.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!trimmed || !emailRegex.test(trimmed)) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiPostPublic<{
        entry: { email: string; position: number };
      }>('/api/waitlist', {
        email: trimmed,
        source: 'landing_footer',
      });
      setJoinedSpot({ position: res.entry.position, email: res.entry.email });
      setWaitlistEmail('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to enroll right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSectionLink = (sectionId: string) => {
    if (onNavigateHomeSection) {
      onNavigateHomeSection(sectionId);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const modalContent = activeModal ? INFO_MODAL_CONTENT[activeModal] : null;

  return (
    <>
      <footer className="bg-white text-black border-t border-neutral-200 px-6 sm:px-12 pt-16 pb-10">
        <div className="max-w-[1280px] mx-auto">
          {/* Main Arixo-Style Multi-Column Footer Grid (NO Pricing!) */}
          <div className="pb-14 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-12 gap-10 text-xs">
            {/* Brand + Tagline + Direct Waitlist Capture */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-4 space-y-5">
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleSectionLink('top')}
                  className="font-display font-semibold text-[24px] tracking-[-0.06em] leading-none text-black inline-flex items-baseline cursor-pointer"
                >
                  <span>Flowstate</span>
                  <span className="text-black font-bold">.</span>
                </button>
                <p className="text-sm text-neutral-600 leading-relaxed max-w-xs">
                  Manage personal and professional tasks, structured workflows, knowledge base docs, and approvals in one workspace.
                </p>
              </div>
            </div>

            {/* Column 1: Navigation (Arixo links minus Pricing) */}
            <div className="lg:col-span-2 space-y-3">
              <div className="font-semibold text-black">Navigation</div>
              <ul className="space-y-2.5 text-neutral-600">
                <li>
                  <button
                    type="button"
                    onClick={() => handleSectionLink('how-it-works')}
                    className="hover:text-black transition-colors cursor-pointer"
                  >
                    How it works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleSectionLink('features')}
                    className="hover:text-black transition-colors cursor-pointer"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenWaitlist}
                    className="hover:text-black transition-colors cursor-pointer"
                  >
                    Waitlist
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => (onOpenContact ? onOpenContact() : undefined)}
                    className="hover:text-black transition-colors cursor-pointer"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Product & Company */}
            <div className="lg:col-span-2 space-y-3">
              <div className="font-semibold text-black">Workspace</div>
              <ul className="space-y-2.5 text-neutral-600">
                <li>
                  <button
                    type="button"
                    onClick={onRegister}
                    className="hover:text-black transition-colors cursor-pointer"
                  >
                    Get started free
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onSignIn}
                    className="hover:text-black transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal('about')}
                    className="hover:text-black transition-colors cursor-pointer"
                  >
                    About
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Quiet Bottom Bar */}
          <div className="pt-6 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-neutral-500">
            <span>© 2026 FLOWSTATE. All rights reserved. By Pandya Shweta</span>
          </div>
        </div>
      </footer>

      {/* Crisp White & Black Info / Legal Modal */}
      <AnimatePresence>
        {modalContent && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-info-modal-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setActiveModal(null)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.25, ease: ARIXO_EASE }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-2xl border border-black/10 bg-white text-black shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-5 border-b border-black/[0.08] flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-neutral-500 mb-1.5">{modalContent.kicker}</div>
                  <h3
                    id="footer-info-modal-title"
                    className="font-display text-lg sm:text-xl font-bold tracking-tight text-black [text-wrap:balance]"
                  >
                    {modalContent.title}
                  </h3>
                  <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                    {modalContent.subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  aria-label="Close dialog"
                  className="w-9 h-9 rounded-lg border border-black/10 bg-[#F7F7F7] hover:bg-neutral-200 text-neutral-700 hover:text-black flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {modalContent.sections.map((section) => (
                  <div key={section.heading} className="space-y-1.5">
                    <h4 className="font-display text-sm font-bold text-black">
                      {section.heading}
                    </h4>
                    <p className="text-xs text-neutral-600 leading-relaxed">{section.body}</p>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 border-t border-black/[0.08] bg-[#F7F7F7] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-medium text-black hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
                {modalContent.ctaLabel && modalContent.ctaAction === 'waitlist' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      onOpenWaitlist();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <span>{modalContent.ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
