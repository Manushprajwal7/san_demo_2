"use client";

import { useEffect, useState, useRef } from "react";

interface RollingNumberProps {
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function RollingNumber({
  prefix = "",
  suffix = "",
  className = "",
}: RollingNumberProps) {
  const [displayValue, setDisplayValue] = useState("0");
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    let lastUpdate = 0;
    const animate = (time: number) => {
      if (time - lastUpdate > 80) { // Slow down to ~12fps
        lastUpdate = time;
        // Generate a random number between 1000 and 99999 for the "rolling" effect
        const randomValue = Math.floor(Math.random() * 90000) + 10000;
        setDisplayValue(randomValue.toLocaleString("en-IN"));
      }
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}
