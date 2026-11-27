import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowRight, CheckCircle2, Mail } from 'lucide-react';
import { ARIXO_EASE, MaskedHeadlineLine } from './MotionPrimitives';

interface ContactViewProps {
  onRegister: () => void;
  onOpenWaitlist: () => void;
}

export const ContactView: React.FC<ContactViewProps> = ({
  onRegister,
  onOpenWaitlist,
}) => {
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = workEmail.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (!company.trim()) {
      setError('Please enter your company or organization name.');
      return;
    }
    if (!message.trim() || message.trim().length < 10) {
      setError('Please include a brief message (at least 10 characters).');
      return;
    }

    setSubmitted(true);
  };

  return (
    <main className="bg-white text-black">
      <section className="py-16 sm:py-24 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* Left Column: Heading + Validated Contact Form (Arixo Contact Layout) */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: ARIXO_EASE }}
              className="lg:col-span-7"
            >
              <h1
                className="font-display font-medium tracking-[-0.04em] leading-[1.06] text-black mb-4 [text-wrap:balance]"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)' }}
              >
                <MaskedHeadlineLine delay={0.05}>
                  Get in touch with us<span className="text-black">.</span>
                </MaskedHeadlineLine>
              </h1>
              <p className="text-base text-neutral-600 leading-relaxed mb-10 max-w-lg">
                Submit a request or email us directly at{' '}
                <a
                  href="mailto:hello@flowstate.ai"
                  className="font-semibold text-black underline underline-offset-4 hover:text-neutral-700"
                >
                  hello@flowstate.ai
                </a>
                . We typically respond within 24 hours.
              </p>

              {!submitted ? (
                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="p-6 sm:p-8 rounded-2xl bg-[#F7F7F7] border border-neutral-200 space-y-5"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-name" className="block text-xs font-semibold text-black">
                        Full name *
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => {
                          setFullName(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Jordan Patel"
                        className="w-full h-11 px-3.5 rounded-lg bg-white border border-neutral-300 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="contact-email" className="block text-xs font-semibold text-black">
                        Work email *
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={workEmail}
                        onChange={(e) => {
                          setWorkEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="jordan@company.com"
                        className="w-full h-11 px-3.5 rounded-lg bg-white border border-neutral-300 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="contact-company" className="block text-xs font-semibold text-black">
                        Company *
                      </label>
                      <input
                        id="contact-company"
                        type="text"
                        required
                        value={company}
                        onChange={(e) => {
                          setCompany(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="Northstar Operations"
                        className="w-full h-11 px-3.5 rounded-lg bg-white border border-neutral-300 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="contact-role" className="block text-xs font-semibold text-black">
                        Role
                      </label>
                      <input
                        id="contact-role"
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Head of Operations"
                        className="w-full h-11 px-3.5 rounded-lg bg-white border border-neutral-300 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="contact-message" className="block text-xs font-semibold text-black">
                      Message *
                    </label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      required
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Tell us about your team's workflows, security requirements, or rollout timeline..."
                      className="w-full p-3.5 rounded-lg bg-white border border-neutral-300 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors resize-y"
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="flex items-center gap-2 text-xs text-red-700 font-medium"
                    >
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="pt-1 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs text-neutral-500">
                      Protected under our Privacy Policy.
                    </span>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-black hover:bg-neutral-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Submit request</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-8 rounded-2xl bg-[#F7F7F7] border border-neutral-200 space-y-4">
                  <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-black tracking-tight">
                    Message received, {fullName}.
                  </h2>
                  <p className="text-sm text-neutral-600 leading-relaxed max-w-md">
                    We have logged your inquiry for <span className="font-semibold text-black">{company}</span> and will reply to{' '}
                    <span className="font-semibold text-black">{workEmail}</span> within 24 hours.
                  </p>
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFullName('');
                        setWorkEmail('');
                        setCompany('');
                        setRole('');
                        setMessage('');
                      }}
                      className="px-4 py-2 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-xs font-semibold text-black transition-colors cursor-pointer"
                    >
                      Send another message
                    </button>
                    <button
                      type="button"
                      onClick={onRegister}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black hover:bg-neutral-800 text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <span>Create workspace now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Right Column: Editorial Customer Quote & Direct Channels (Arixo Contact Layout) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.14, ease: ARIXO_EASE }}
              className="lg:col-span-5 space-y-6 lg:pt-6"
            >
              <div className="p-8 rounded-2xl bg-[#F7F7F7] border border-black/[0.08] space-y-6">
                <p className="font-display text-lg sm:text-xl font-semibold text-black leading-relaxed">
                  “FLOWSTATE changed how our operations team handles incident handoffs entirely. We stopped spending the first 15 minutes of every review recapping the last one — every runbook citation, owner, and approval is already documented before anyone closes their laptop.”
                </p>

                <div className="pt-5 border-t border-black/[0.08] flex items-center gap-3.5">
                  <img
                    src="/src/assets/images/waitlist_avatar_director_1795775956413.jpg"
                    alt="Jack Mercer, Head of Operations at Kestrel Cloud"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover grayscale border border-neutral-300"
                  />
                  <div>
                    <div className="text-sm font-bold text-black">Jack Mercer</div>
                    <div className="text-xs text-neutral-600">Head of Operations, Kestrel Cloud</div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-black/[0.08] space-y-4">
                <div className="flex items-center gap-2.5 text-sm font-bold text-black">
                  <Mail className="w-4 h-4" />
                  <span>Direct channels</span>
                </div>
                <div className="space-y-2.5 text-xs text-neutral-600">
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span>General &amp; Enterprise</span>
                    <a
                      href="mailto:hello@flowstate.ai"
                      className="font-semibold text-black hover:underline"
                    >
                      hello@flowstate.ai
                    </a>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-neutral-100">
                    <span>Security &amp; Compliance</span>
                    <a
                      href="mailto:security@flowstate.ai"
                      className="font-semibold text-black hover:underline"
                    >
                      security@flowstate.ai
                    </a>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span>Priority Rollout</span>
                    <button
                      type="button"
                      onClick={onOpenWaitlist}
                      className="font-semibold text-black hover:underline cursor-pointer"
                    >
                      Join waitlist →
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  );
};
