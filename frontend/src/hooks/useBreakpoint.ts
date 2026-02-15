import { useState, useEffect } from 'react';

export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

function getBreakpoint(width: number): Breakpoint {
  if (width >= 1024) return 'desktop';
  if (width >= 768) return 'tablet';
  return 'mobile';
}

/**
 * Hook to track viewport breakpoint with 150ms debounce.
 * - desktop: >= 1024px
 * - tablet: 768-1023px
 * - mobile: < 768px
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    getBreakpoint(window.innerWidth)
  );

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setBreakpoint(getBreakpoint(window.innerWidth));
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return breakpoint;
}
