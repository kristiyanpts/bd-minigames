// Based on useInterval.ts

import { useCallback, useEffect, useRef } from "react";

const useTimeout = (callback: () => void, delay?: number | undefined) => {
  const savedCallback = useRef<() => void>();
  const id = useRef<number>();

  const startTimeout = useCallback(() => {
    function tick() {
      savedCallback.current?.();
    }

    clearTimeout(id.current);
    id.current = setTimeout(tick, delay);

    return () => clearTimeout(id.current);
  }, [delay]);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  return startTimeout;
};

export default useTimeout;
