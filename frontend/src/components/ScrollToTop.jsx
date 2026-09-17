import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Automatically resets scroll position to top (0, 0) whenever the route changes.
 * Handles window, document body, and any inner scrollable containers (e.g. admin layout).
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);
      if (document.body) {
        document.body.scrollTo(0, 0);
      }
      
      // Also reset any scrollable main containers (like in admin layout)
      const mainElements = document.querySelectorAll('main, .overflow-y-auto');
      mainElements.forEach((el) => {
        el.scrollTo(0, 0);
      });
    } else {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);

  return null;
}
