import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen } from 'lucide-react';
import { BLOG_CATEGORIES, BLOG_POSTS, BlogCategory, BlogPost } from './blogData';
import { ARIXO_EASE, ARIXO_SNAPPY_SPRING, MaskedHeadlineLine } from './MotionPrimitives';

interface BlogImageProps {
  src: string;
  alt: string;
  title: string;
  className?: string;
}

export const BlogEditorialImage: React.FC<BlogImageProps> = ({
  src,
  alt,
  title,
  className = 'w-full aspect-[4/3] object-cover',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-label={alt}
        className="w-full aspect-[4/3] bg-[#F5F5F5] border-b border-neutral-200 flex flex-col items-center justify-center p-6 text-center"
      >
        <BookOpen className="w-6 h-6 text-black mb-2" />
        <span className="text-xs font-medium text-neutral-600 max-w-[24ch]">{title}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

interface AuthorAvatarProps {
  src: string;
  alt: string;
  initials: string;
}

const AuthorAvatar: React.FC<AuthorAvatarProps> = ({ src, alt, initials }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-label={alt}
        className="w-8 h-8 rounded-full bg-black text-white text-[11px] font-semibold flex items-center justify-center shrink-0"
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-8 h-8 rounded-full object-cover grayscale shrink-0 border border-neutral-200"
    />
  );
};

interface BlogArchiveViewProps {
  onSelectPost: (slug: string) => void;
  onRegister: () => void;
  onOpenWaitlist: () => void;
}

export const BlogArchiveView: React.FC<BlogArchiveViewProps> = ({
  onSelectPost,
  onRegister,
  onOpenWaitlist,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | BlogCategory>('All');

  const filteredPosts =
    selectedCategory === 'All'
      ? BLOG_POSTS
      : BLOG_POSTS.filter((p) => p.category === selectedCategory);

  return (
    <main className="bg-white text-black">
      {/* Editorial Blog Header (Arixo-faithful) */}
      <section className="pt-16 sm:pt-24 pb-12 px-6 sm:px-8 border-b border-black/[0.08]">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <h1
              className="font-display font-medium tracking-[-0.04em] leading-[1.04] text-black mb-5 [text-wrap:balance]"
              style={{ fontSize: 'clamp(2.75rem, 6vw, 4.75rem)' }}
            >
              <MaskedHeadlineLine delay={0.06}>
                Blog<span className="text-black">.</span>
              </MaskedHeadlineLine>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.14, ease: ARIXO_EASE }}
              className="text-base sm:text-lg text-neutral-600 leading-relaxed max-w-xl"
            >
              Practical ideas on voice-driven automation, grounded RAG runbooks, approval governance, and building calmer systems for growing companies.
            </motion.p>
          </div>

          {/* Interactive Category Filter Tabs */}
          <div
            role="tablist"
            aria-label="Filter articles by topic"
            className="mt-10 flex flex-wrap items-center gap-2"
          >
            {BLOG_CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(category)}
                  className={`relative px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-white'
                      : 'bg-[#F5F5F5] text-neutral-700 hover:bg-neutral-200 hover:text-black'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="archiveBlogTab"
                      transition={ARIXO_SNAPPY_SPRING}
                      className="absolute inset-0 bg-black rounded-lg"
                    />
                  )}
                  <span className="relative z-10">{category}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2-Column Editorial Articles Grid */}
      <section className="py-14 sm:py-20 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            <AnimatePresence mode="popLayout">
              {filteredPosts.map((post, idx) => (
                <motion.article
                  key={post.slug}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.42, delay: idx * 0.05, ease: ARIXO_EASE }}
                  className="group flex flex-col bg-white border border-black/[0.08] rounded-2xl overflow-hidden hover:border-black transition-colors duration-200"
                >
                  <button
                    type="button"
                    onClick={() => onSelectPost(post.slug)}
                    className="text-left flex flex-col flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    <div className="overflow-hidden bg-[#F7F7F7] border-b border-black/[0.07]">
                    <BlogEditorialImage
                      src={post.coverImage}
                      alt={post.coverAlt}
                      title={post.title}
                      className="w-full aspect-[4/3] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>

                  <div className="p-6 sm:p-8 flex flex-col flex-1 justify-between">
                    <div>
                      {/* Zero-pill clean unboxed metadata */}
                      <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                        <span className="font-semibold text-black">{post.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.date}</span>
                        <span aria-hidden="true">·</span>
                        <span>{post.readTime}</span>
                      </div>

                      <h2 className="font-display text-xl sm:text-2xl font-bold tracking-[-0.025em] text-black leading-snug mb-3 group-hover:underline decoration-1 underline-offset-4 [text-wrap:balance]">
                        {post.title}
                      </h2>

                      <p className="text-sm text-neutral-600 leading-relaxed mb-6">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="pt-5 border-t border-neutral-200 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <AuthorAvatar
                          src={post.author.avatar}
                          alt={post.author.name}
                          initials={post.author.initials}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-black truncate">
                            {post.author.name}
                          </div>
                          <div className="text-[11px] text-neutral-500 truncate">
                            {post.author.role}
                          </div>
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-black shrink-0">
                        <span>Read</span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
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

      {/* Bottom Conversion Banner */}
      <section className="py-20 sm:py-28 px-6 sm:px-8 border-t border-neutral-200 bg-[#F7F7F7]">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="font-display font-bold tracking-[-0.035em] text-black leading-[1.08] mb-4 [text-wrap:balance]"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)' }}
          >
            Your next workflow starts in a few seconds<span className="text-black">.</span>
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 mb-8 max-w-lg mx-auto leading-relaxed">
            Speak your instruction, ground it in your runbooks, and approve execution - all before you close the tab.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onRegister}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-black hover:bg-neutral-800 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Get started free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenWaitlist}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white hover:bg-neutral-100 text-black border border-neutral-300 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Join waitlist</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

interface BlogArticleViewProps {
  post: BlogPost;
  onBackToBlog: () => void;
  onSelectPost: (slug: string) => void;
  onRegister: () => void;
}

export const BlogArticleView: React.FC<BlogArticleViewProps> = ({
  post,
  onBackToBlog,
  onSelectPost,
  onRegister,
}) => {
  const relatedPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <main className="bg-white text-black">
      <article className="pt-12 sm:pt-16 pb-20 px-6 sm:px-8">
        <div className="max-w-3xl mx-auto">
          <button
            type="button"
            onClick={onBackToBlog}
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-black transition-colors mb-8 cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All articles</span>
          </button>

          {/* Clean Unboxed Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-4">
            <span className="font-semibold text-black">{post.category}</span>
            <span aria-hidden="true">·</span>
            <span>{post.date}</span>
            <span aria-hidden="true">·</span>
            <span>{post.readTime}</span>
          </div>

          <h1
            className="font-display font-bold tracking-[-0.035em] text-black leading-[1.08] mb-5 [text-wrap:balance]"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 3.25rem)' }}
          >
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 leading-relaxed mb-8">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-3 pb-8 border-b border-neutral-200 mb-10">
            <AuthorAvatar
              src={post.author.avatar}
              alt={post.author.name}
              initials={post.author.initials}
            />
            <div>
              <div className="text-sm font-semibold text-black">{post.author.name}</div>
              <div className="text-xs text-neutral-500">{post.author.role}</div>
            </div>
          </div>

          {/* Editorial Cover Image */}
          <div className="rounded-2xl overflow-hidden border border-neutral-200 bg-[#F7F7F7] mb-10">
            <BlogEditorialImage
              src={post.coverImage}
              alt={post.coverAlt}
              title={post.title}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>

          {/* Key Takeaways Summary Box (clean neutral surface, hairline border, no thick left bar) */}
          <div className="rounded-2xl bg-[#F7F7F7] border border-neutral-200 p-6 sm:p-8 mb-12">
            <h2 className="font-display text-sm font-bold text-black mb-4">
              Key takeaways
            </h2>
            <ul className="space-y-2.5 text-sm text-neutral-700 leading-relaxed">
              {post.keyTakeaways.map((point, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="font-mono text-xs text-black font-semibold mt-0.5 tabular-nums">
                    0{idx + 1}.
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Article Body Sections */}
          <div className="space-y-10">
            {post.sections.map((section) => (
              <section key={section.heading} className="space-y-4">
                <h2 className="font-display text-xl sm:text-2xl font-bold tracking-[-0.02em] text-black [text-wrap:balance]">
                  {section.heading}
                </h2>
                {section.paragraphs.map((para, idx) => (
                  <p key={idx} className="text-[15px] sm:text-base text-neutral-700 leading-[1.75]">
                    {para}
                  </p>
                ))}
                {section.callout && (
                  <blockquote className="my-6 p-6 rounded-xl bg-[#F7F7F7] border border-neutral-200 text-base font-medium text-black leading-relaxed">
                    “{section.callout}”
                  </blockquote>
                )}
              </section>
            ))}
          </div>

          {/* Inline Article CTA */}
          <div className="mt-14 p-8 rounded-2xl bg-black text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold tracking-tight mb-1.5">
                Put this workflow into practice.
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-md leading-relaxed">
                Create a clean FLOWSTATE workspace and test voice commands, RAG runbooks, and approval gates in two minutes.
              </p>
            </div>
            <button
              type="button"
              onClick={onRegister}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Create free workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      <section className="py-16 px-6 sm:px-8 border-t border-neutral-200 bg-[#F7F7F7]">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-[-0.03em] text-black">
              More from the blog<span className="text-black">.</span>
            </h2>
            <button
              type="button"
              onClick={onBackToBlog}
              className="text-xs font-semibold text-black hover:underline cursor-pointer whitespace-nowrap"
            >
              View all 4 articles
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((rel) => (
              <button
                key={rel.slug}
                type="button"
                onClick={() => onSelectPost(rel.slug)}
                className="group text-left bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:border-black transition-colors flex flex-col cursor-pointer"
              >
                <div className="overflow-hidden border-b border-neutral-200 bg-[#F7F7F7]">
                  <BlogEditorialImage
                    src={rel.coverImage}
                    alt={rel.coverAlt}
                    title={rel.title}
                    className="w-full aspect-[4/3] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
                      <span className="font-semibold text-black">{rel.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{rel.date}</span>
                    </div>
                    <h3 className="font-display text-base font-bold text-black leading-snug group-hover:underline">
                      {rel.title}
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-600">
                    <span>{rel.author.name}</span>
                    <span>{rel.readTime}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
