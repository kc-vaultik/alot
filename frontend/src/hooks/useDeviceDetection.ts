import { useEffect, useState, useRef, useCallback } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Unified hook for detecting mobile devices
 * Uses matchMedia for reliable responsive detection
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    
    setIsMobile(mediaQuery.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isMobile;
};

/**
 * Optimized scroll position hook with requestAnimationFrame throttling
 * Returns 0 on mobile to disable parallax effects
 */
export const useScrollPosition = () => {
  const [scrollY, setScrollY] = useState(0);
  const isMobile = useIsMobile();
  const ticking = useRef(false);

  const updateScrollY = useCallback(() => {
    setScrollY(window.scrollY);
    ticking.current = false;
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollY);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [updateScrollY, isMobile]);

  return isMobile ? 0 : scrollY;
};

/**
 * Section-relative scroll position for parallax effects
 * Returns 0 on mobile to disable parallax effects
 */
export const useSectionScroll = (sectionRef: React.RefObject<HTMLElement>) => {
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const isMobile = useIsMobile();
  const ticking = useRef(false);

  useEffect(() => {
    if (isMobile) return;

    const updateOffset = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        setParallaxOffset((windowHeight - rect.top) * 0.1);
      }
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateOffset);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionRef, isMobile]);

  return isMobile ? 0 : parallaxOffset;
};
