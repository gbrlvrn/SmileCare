import { useEffect, useState } from 'react';

/**
 * Returns `value` only after it stopped changing for `delay` ms.
 * Used for search boxes so we don't call the API on every key press.
 * @template T
 * @param {T} value
 * @param {number} [delay=400]
 * @returns {T}
 */
export default function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer); // cancel if value changes again before the delay
  }, [value, delay]);

  return debounced;
}
