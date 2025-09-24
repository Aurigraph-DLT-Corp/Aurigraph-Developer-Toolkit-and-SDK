import { useEffect } from 'react';

/**
 * Hook to scroll to a specific section on page load
 * @param sectionId - ID of the section to scroll to
 */
export const useScrollTo = (sectionId?: string) => {
  useEffect(() => {
    if (sectionId) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [sectionId]);
};