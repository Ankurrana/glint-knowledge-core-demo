import { useEffect, useRef, useState } from 'react';

export default function usePlayback(duration: number, paused: boolean, onTime: (seconds: number) => void) {
  const [elapsed, setElapsed] = useState(0);
  const clock = useRef({ time: 0, last: 0, paused });
  useEffect(() => {
    clock.current.paused = paused;
    clock.current.last = performance.now();
  }, [paused]);
  useEffect(() => {
    let frame = 0;
    clock.current.last = performance.now();
    onTime(0);
    const tick = () => {
      const now = performance.now();
      const state = clock.current;
      if (!state.paused) {
        state.time = Math.min(duration, state.time + (now - state.last) / 1000);
        setElapsed(state.time);
        onTime(state.time);
      }
      state.last = now;
      if (state.time < duration) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [duration, onTime]);
  return elapsed;
}
