import { useState, useEffect } from 'react';

const useMobile = (query: string = '(max-width: 768px)') => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleResize = () => setIsMobile(mediaQuery.matches);

    handleResize();
    mediaQuery.addEventListener('change', handleResize);

    return () => mediaQuery.removeEventListener('change', handleResize);
  }, [query]);

  return isMobile;
};

export default useMobile;

