import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Mic,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { apiPostJson, apiPostPublic, setStoredSessionToken } from '../../lib/api';
import { auth, googleProvider } from '../../lib/firebase';
import { WorkspaceType } from '../../types';

interface AuthViewProps {
  onSuccess: (type?: WorkspaceType) => void;
  onAuthSessionEstablished?: () => Promise<void>;
  onNavigatePublic?: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccess,
  onAuthSessionEstablished,
  onNavigatePublic,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<
    'login' | 'register' | 'forgot_password' | 'verify_email' | 'workspace_choice'
  >(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [verificationCodePreview, setVerificationCodePreview] = useState<string | null>(null);

  const [selectedWorkspaceType, setSelectedWorkspaceType] = useState<WorkspaceType>('personal');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'forgot_password') {
      setLoading(true);
      try {
        if (resetToken.trim() && newPassword.length >= 6) {
          await apiPostPublic('/api/auth/reset-password', {
            email: email.trim(),
            token: resetToken.trim(),
            newPassword,
          });
          setInfoMessage('Password updated successfully. You may now sign in.');
          setResetToken('');
          setNewPassword('');
          setMode('login');
        } else {
          const res = await apiPostPublic<{ message: string; resetTokenPreview?: string }>(
            '/api/auth/forgot-password',
            { email: email.trim() }
          );
          setInfoMessage(
            res.resetTokenPreview
              ? `Reset token generated (${res.resetTokenPreview}). Enter it below to set a new password.`
              : res.message
          );
          if (res.resetTokenPreview) {
            setResetToken(res.resetTokenPreview);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Could not process password reset.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password.length < 6) {
      setError('Password needs to be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        if (!agreeTerms) {
          setError('Please accept the Terms and Privacy Policy to continue.');
          setLoading(false);
          return;
        }

        const res = await apiPostPublic<{
          token: string;
          user: { verificationToken?: string };
        }>('/api/auth/register', {
          email: email.trim(),
          password,
          displayName: name.trim() || email.split('@')[0],
        });
        setStoredSessionToken(res.token);
        if (res.user?.verificationToken) {
          setVerificationCodePreview(res.user.verificationToken);
        }
        setMode('verify_email');
      } else {
        const res = await apiPostPublic<{ token: string }>('/api/auth/login', {
          email: email.trim(),
          password,
        });
        setStoredSessionToken(res.token);
        await onAuthSessionEstablished?.();
        onSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setError(null);
    setLoading(true);
    try {
      await apiPostJson('/api/auth/verify-email', {
        token: verificationCodePreview || undefined,
      });
      setMode('workspace_choice');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      setStoredSessionToken(null);
      await signInWithPopup(auth, googleProvider);
      await onAuthSessionEstablished?.();
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/unauthorized-domain')) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setError(
          `Google Sign-In is blocked on "${host}" because it is not listed under Authorized Domains in Firebase Console (project: isentropic-joy-m77bw). Try opening http://localhost:3000, add "${host}" in Firebase Console → Authentication → Settings → Authorized domains, or sign in with Email & Password above.`
        );
      } else if (!msg.includes('auth/popup-closed-by-user')) {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinishWorkspaceChoice = async () => {
    await onAuthSessionEstablished?.();
    onSuccess(selectedWorkspaceType);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] dark:bg-[#0A0A0A] flex flex-col justify-center items-center p-4 sm:p-6 transition-colors">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#121212] border border-[#E5E5E5] dark:border-[#262626] rounded-2xl overflow-hidden shadow-lg">
        {/* Left Light Brand & Feature Panel (matching reference split-card design) */}
        <div className="lg:col-span-6 p-7 sm:p-10 bg-[#FAFAFA] dark:bg-[#161616] border-b lg:border-b-0 lg:border-r border-[#E5E5E5] dark:border-[#262626] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <img
                src="/icons/favicon_io/apple-touch-icon.png"
                alt="FLOWSTATE"
                className="w-9 h-9 rounded-lg object-cover"
              />
              <span className="font-display font-bold text-xl tracking-tight text-[#111111] dark:text-white">
                FLOWSTATE
              </span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111111] dark:text-white mb-3 leading-snug">
              AI-Driven Company
              <br />
              Workflows &amp; Operations
            </h2>
            <p className="text-xs sm:text-sm text-[#525252] dark:text-[#A3A3A3] leading-relaxed mb-8 max-w-md">
              Turn voice or text directives into structured workflows, grounded runbook answers, and human-approved execution.
            </p>
          </div>

          <div>
            <div className="border-t border-[#E5E5E5] dark:border-[#262626] divide-y divide-[#E5E5E5] dark:divide-[#262626] text-xs">
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="font-medium text-[#111111] dark:text-white">AI Command Center</span>
                <span className="text-[#737373]">Voice &amp; text workflow drafting</span>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="font-medium text-[#111111] dark:text-white">Knowledge Base RAG</span>
                <span className="text-[#737373]">PDF, DOCX &amp; TXT citations</span>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="font-medium text-[#111111] dark:text-white">Approvals &amp; Audit</span>
                <span className="text-[#737373]">5-tier RBAC &amp; CSV/JSON logs</span>
              </div>
            </div>

            {onNavigatePublic && (
              <button
                type="button"
                onClick={onNavigatePublic}
                className="mt-6 text-xs text-[#737373] hover:text-[#111111] dark:hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>← Back to public overview</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Form Container */}
        <div className="lg:col-span-6 p-7 sm:p-10 flex flex-col justify-center bg-white dark:bg-[#121212]">
          {mode === 'verify_email' ? (
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F5F5] dark:bg-[#1A1A1A] text-[#111111] dark:text-white border border-[#E5E5E5] dark:border-[#262626] text-xs font-semibold">
                <Mail className="w-3.5 h-3.5" />
                <span>Verify Your Email</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-[#111111] dark:text-white">
                Confirm your account email
              </h3>
              <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] leading-relaxed">
                We registered your account for <span className="font-semibold text-[#111111] dark:text-white">{email}</span>. Verify your email address to unlock workspace creation and organization invitations.
              </p>
              {verificationCodePreview && (
                <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#161616] border border-[#E5E5E5] dark:border-[#262626] text-xs font-mono text-[#525252] dark:text-[#D4D4D4]">
                  Verification Token: {verificationCodePreview}
                </div>
              )}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-semibold text-sm cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Verifying...' : 'Verify Email & Continue'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('workspace_choice')}
                  className="px-4 py-3 rounded-xl border border-[#E5E5E5] dark:border-[#333333] text-xs font-semibold text-[#525252] dark:text-[#D4D4D4] cursor-pointer"
                >
                  Verify Later
                </button>
              </div>
            </div>
          ) : mode === 'workspace_choice' ? (
            <div>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Account Ready</span>
                </div>
                <h3 className="font-display text-2xl font-bold text-[#111111] dark:text-white">
                  Choose your starting workspace
                </h3>
                <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                  You can maintain a Personal Workspace and join or create multiple Organizations anytime under this single account.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <button
                  type="button"
                  onClick={() => setSelectedWorkspaceType('personal')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                    selectedWorkspaceType === 'personal'
                      ? 'border-[#111111] dark:border-white bg-[#F5F5F5] dark:bg-[#1F1F1F] shadow-sm'
                      : 'border-[#E5E5E5] dark:border-[#262626] hover:bg-[#FAFAFA] dark:hover:bg-[#1A1A1A]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedWorkspaceType === 'personal'
                        ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111]'
                        : 'bg-[#F2F2F2] dark:bg-[#202020] text-[#525252] dark:text-[#D4D4D4]'
                    }`}
                  >
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#111111] dark:text-white">
                        Personal Workspace
                      </span>
                      {selectedWorkspaceType === 'personal' && (
                        <div className="w-5 h-5 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#737373] dark:text-[#737373] mt-1 leading-relaxed">
                      A private environment for individual productivity and personal workflow automation.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedWorkspaceType('organization')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                    selectedWorkspaceType === 'organization'
                      ? 'border-[#111111] dark:border-white bg-[#F5F5F5] dark:bg-[#1F1F1F] shadow-sm'
                      : 'border-[#E5E5E5] dark:border-[#262626] hover:bg-[#FAFAFA] dark:hover:bg-[#1A1A1A]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedWorkspaceType === 'organization'
                        ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111]'
                        : 'bg-[#F2F2F2] dark:bg-[#202020] text-[#525252] dark:text-[#D4D4D4]'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#111111] dark:text-white">
                        Organization Workspace
                      </span>
                      {selectedWorkspaceType === 'organization' && (
                        <div className="w-5 h-5 rounded-full bg-[#111111] dark:bg-white text-white dark:text-[#111111] flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#737373] dark:text-[#737373] mt-1 leading-relaxed">
                      A shared environment for teams, departments, approvals, and company operations.
                    </p>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => void handleFinishWorkspaceChoice()}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] font-medium text-sm transition-colors shadow-sm cursor-pointer"
              >
                <span>Continue to Onboarding</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="font-display text-2xl font-bold text-[#111111] dark:text-white">
                  {mode === 'register'
                    ? 'Create a free Account'
                    : mode === 'forgot_password'
                    ? 'Reset your password'
                    : 'Sign in to FLOWSTATE'}
                </h3>
                <p className="text-xs sm:text-sm text-[#737373] dark:text-[#737373] mt-1">
                  {mode === 'register'
                    ? 'Register once to access personal and organization workspaces.'
                    : mode === 'forgot_password'
                    ? 'Enter your email to generate a reset token and update your password.'
                    : 'Access your persistent workflows, approval queues, and knowledge base.'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {infoMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-[#737373] absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Chen"
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#737373] absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex.chen@company.com"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                    />
                  </div>
                </div>

                {mode === 'forgot_password' ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                        Reset Token (auto-filled after request)
                      </label>
                      <input
                        type="text"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Paste reset token"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                      />
                    </div>
                    {resetToken && (
                      <div>
                        <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4] mb-1.5">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-[#404040] dark:text-[#D4D4D4]">
                        Password
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setMode('forgot_password')}
                          className="text-xs text-[#111111] dark:text-white hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#737373] absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#161616] text-[#111111] dark:text-white focus:outline-none focus:border-[#111111] dark:focus:border-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3.5 top-2.5 text-[#737373] hover:text-[#525252] dark:hover:text-[#E5E5E5] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <label className="flex items-start gap-2.5 text-xs text-[#525252] dark:text-[#737373] cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded text-[#111111] dark:text-white focus:ring-[#111111]"
                    />
                    <span>
                      I agree to the Terms and Privacy Policy.
                    </span>
                  </label>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#111111] hover:bg-[#262626] dark:bg-white dark:hover:bg-[#E5E5E5] text-white dark:text-[#111111] disabled:opacity-60 font-medium text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
                >
                  <span>
                    {loading
                      ? 'Processing...'
                      : mode === 'register'
                      ? 'Sign Up Now'
                      : mode === 'forgot_password'
                      ? resetToken
                        ? 'Confirm New Password'
                        : 'Request Reset Token'
                      : 'Sign In to Workspace'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {false && (
                <>
                  <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[#E5E5E5] dark:border-[#262626]" />
                    </div>
                    <span className="relative px-3 bg-white dark:bg-[#121212] text-xs font-mono uppercase text-[#737373]">
                      Or continue with
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-white dark:bg-[#161616] hover:bg-[#FAFAFA] dark:hover:bg-[#1F1F1F] text-[#404040] dark:text-[#E5E5E5] text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </>
              )}

              <div className="mt-6 text-center text-xs text-[#737373] dark:text-[#737373]">
                {mode === 'register' ? (
                  <div>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-[#111111] dark:text-white font-semibold hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                ) : (
                  <div>
                    Need a new workspace?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-[#111111] dark:text-white font-semibold hover:underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
