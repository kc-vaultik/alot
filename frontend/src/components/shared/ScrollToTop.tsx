/**
 * @fileoverview Scroll to top utility component
 * 
 * Automatically scrolls the page to the top when the route changes.
 * Place this component once near the root of your app (e.g., inside the Router).
 * 
 * @example
 * ```tsx
 * <Router>
 *   <ScrollToTop />
 *   <Routes>...</Routes>
 * </Router>
 * ```
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls to the top of the page on route change.
 * This is a render-null component that only provides side effects.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};
