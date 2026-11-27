import React, { useRef } from 'react';
import {
  AnimatePresence,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from 'motion/react';

export const ARIXO_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const ARIXO_SPRING = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 36,
  mass: 0.9,
};

export const ARIXO_SNAPPY_SPRING = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.65,
};

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  delay = 0,
  y = 24,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{
        duration: 0.65,
        delay,
        ease: ARIXO_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface MaskedHeadlineLineProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const MaskedHeadlineLine: React.FC<MaskedHeadlineLineProps> = ({
  children,
  delay = 0,
  className,
}) => {
  return (
    <span className="block overflow-hidden pb-[0.06em] -mb-[0.06em]">
      <motion.span
        initial={{ y: '108%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{
          duration: 0.72,
          delay,
          ease: ARIXO_EASE,
        }}
        className={`block ${className ?? ''}`}
      >
        {children}
      </motion.span>
    </span>
  );
};

interface ScrollTiltFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollTiltFrame: React.FC<ScrollTiltFrameProps> = ({
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 160,
    damping: 28,
    mass: 0.4,
  });

  const rotateX = useTransform(smoothProgress, [0, 1], [5.5, 0]);
  const scale = useTransform(smoothProgress, [0, 1], [0.972, 1]);
  const y = useTransform(smoothProgress, [0, 1], [22, 0]);

  return (
    <div ref={ref} style={{ perspective: 1400 }} className={className}>
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay: 0.3, ease: ARIXO_EASE }}
        style={{
          rotateX,
          scale,
          y,
          transformStyle: 'preserve-3d',
          willChange: 'transform',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

interface CompactAudioVisualizerProps {
  bars?: number;
  height?: number;
  active?: boolean;
  tone?: 'dark' | 'light';
  className?: string;
}

const WAVE_WEIGHTS = [
  0.34, 0.58, 0.86, 0.48, 0.96, 0.72, 0.4, 0.9, 0.66, 0.52,
  0.94, 0.62, 0.36, 0.82, 0.54, 0.76, 0.44, 0.88, 0.6, 0.38,
  0.74, 0.5, 0.84, 0.42,
];

export const CompactAudioVisualizer: React.FC<CompactAudioVisualizerProps> = ({
  bars = 20,
  height = 36,
  active = true,
  tone = 'dark',
  className = '',
}) => {
  const barColor = tone === 'dark' ? 'bg-black' : 'bg-white';

  return (
    <div
      aria-hidden="true"
      className={`inline-flex items-center justify-center gap-[3px] ${className}`}
      style={{ height }}
    >
      {Array.from({ length: bars }).map((_, idx) => {
        const weight = WAVE_WEIGHTS[idx % WAVE_WEIGHTS.length];
        const barH = Math.max(8, Math.round(height * weight));
        const duration = 0.72 + ((idx * 17) % 9) * 0.085;
        const delay = ((idx * 11) % 10) * 0.07;

        return (
          <span
            key={idx}
            className={`w-[2.5px] rounded-full ${barColor} ${
              active ? 'animate-voice-bar' : 'opacity-30'
            }`}
            style={{
              height: `${barH}px`,
              opacity: active ? 0.32 + weight * 0.68 : 0.25,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};

interface SmoothAccordionProps {
  isOpen: boolean;
  children: React.ReactNode;
}

export const SmoothAccordionBody: React.FC<SmoothAccordionProps> = ({
  isOpen,
  children,
}) => {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="accordion-body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: ARIXO_EASE }}
          className="overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface BrandMarkItem {
  name: string;
  symbol: React.ReactNode;
}

const CLIENT_BRANDS: BrandMarkItem[] = [
  {
    name: 'f&f',
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="5" height="5" fill="currentColor" />
        <rect x="9" y="9" width="5" height="5" fill="currentColor" />
        <rect x="9" y="2" width="5" height="5" fill="currentColor" fillOpacity="0.28" />
      </svg>
    ),
  },
  {
    name: 'velvora',
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 3L8 13L14 3" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'kardo',
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="8" cy="8" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'aerohive',
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: 'atlas',
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 12L6.5 4L10 10L12.2 6.5L14 12H2Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'lume studio',
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5V14.5M1.5 8H14.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: 'orbital',
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <ellipse cx="8" cy="8" rx="6.2" ry="3.2" transform="rotate(-25 8 8)" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="8" cy="8" r="1.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'northstar',
    symbol: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.5L9.8 6.2L14.5 8L9.8 9.8L8 14.5L6.2 9.8L1.5 8L6.2 6.2L8 1.5Z" fill="currentColor" />
      </svg>
    ),
  },
];

export const InfiniteLogoTicker: React.FC = () => {
  const repeated = [...CLIENT_BRANDS, ...CLIENT_BRANDS];

  return (
    <div className="relative w-full overflow-hidden marquee-mask py-2">
      <div className="animate-marquee items-center">
        {repeated.map((brand, idx) => (
          <div
            key={`${brand.name}-${idx}`}
            className="inline-flex items-center gap-2.5 px-8 sm:px-11 text-black/65 hover:text-black transition-colors duration-200 select-none shrink-0"
          >
            <span className="shrink-0">{brand.symbol}</span>
            <span className="font-display text-[17px] sm:text-[18px] font-semibold tracking-[-0.03em] lowercase whitespace-nowrap">
              {brand.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
