import { useEffect, useState } from 'react';

interface TerminalSize {
  width: number;
  height: number;
}

export const useTerminalSize = (): TerminalSize => {
  const [size, setSize] = useState<TerminalSize>({
    width: process.stdout.columns ?? 80,
    height: process.stdout.rows ?? 24,
  });

  useEffect(() => {
    const updateSize = () => {
      const newSize = {
        width: process.stdout.columns ?? 80,
        height: process.stdout.rows ?? 24,
      };
      // Debug: Log terminal size changes (removed for production)
      setSize(newSize);
    };

    // Initial size log (removed for production)

    // Listen for terminal resize events
    process.stdout.on('resize', updateSize);

    return () => {
      process.stdout.off('resize', updateSize);
    };
  }, []);

  return size;
};