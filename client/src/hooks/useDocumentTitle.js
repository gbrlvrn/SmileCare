import { useEffect } from 'react';

/**
 * Sets the browser tab title to "<title> | SmileCare" while the component is shown.
 * @param {string} [title] when empty, the default "SmileCare | Dental Clinic" is used
 */
export default function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | SmileCare` : 'SmileCare | Dental Clinic';
  }, [title]);
}
