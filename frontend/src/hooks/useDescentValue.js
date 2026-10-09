import { useEffect, useState } from 'react';
import { descent, subscribeDescent } from '../lib/descent.js';

/** Re-renders only when the active stratum (or quality) changes, not every frame. */
export function useDescentValue(select) {
  const [value, setValue] = useState(() => select(descent));

  useEffect(() => {
    setValue(select(descent));
    return subscribeDescent((d) => {
      setValue((prev) => {
        const next = select(d);
        return Object.is(prev, next) ? prev : next;
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}
