import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Wraps page content with a smooth reveal animation on every route change.
 * Uses CSS `@keyframes` for a fade-up-in effect each time the pathname changes.
 */
export default function PageTransition({ children }) {
  const { pathname } = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [animKey, setAnimKey] = useState(0);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      setAnimKey((k) => k + 1);
      setDisplayChildren(children);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div key={animKey} className="sc-page-transition">
      {displayChildren}
    </div>
  );
}
