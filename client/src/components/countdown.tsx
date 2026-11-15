import { useEffect, useRef, useState } from "react";
import { formatSeconds, secondsUntil } from "@/lib/time";

const TICK_MS = 1000;

interface CountdownProps {
  /** End time in epoch milliseconds. Give a new `key` to restart with another time. */
  until: number;
  /** Called once when the countdown reaches zero. */
  onEnd?: () => void;
}

/**
 * A ticking `m:ss` until a moment. It owns its clock, so a tick re-renders only
 * this text, never the screen around it. Ticks are not announced (`aria-live`
 * off): the enclosing message is announced once with the starting value.
 */
export function Countdown({ until, onEnd }: CountdownProps) {
  const [now, setNow] = useState(Date.now);
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    if (secondsUntil(until, Date.now()) === 0) {
      onEndRef.current?.();
      return undefined;
    }
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (secondsUntil(until, current) === 0) {
        clearInterval(id);
        onEndRef.current?.();
      }
    }, TICK_MS);
    return () => {
      clearInterval(id);
    };
  }, [until]);

  return (
    <span role="timer" aria-live="off" className="tabular-nums">
      {formatSeconds(secondsUntil(until, now))}
    </span>
  );
}
