import { useEffect, useRef, useState } from "react";

export function useAnimatedNumber(value: number, durationMs = 100) {
  const [animatedValue, setAnimatedValue] = useState(value);
  const animatedValueRef = useRef(value);
  const animationFrameRef = useRef<number | null>(null);
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    animatedValueRef.current = animatedValue;
  }, [animatedValue]);

  useEffect(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      setAnimatedValue(value);
      return;
    }

    const startValue = animatedValueRef.current;
    const delta = value - startValue;

    if (Math.abs(delta) < 0.0001) {
      setAnimatedValue(value);
      return;
    }

    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (startTimestamp === null) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / durationMs, 1);
      setAnimatedValue(startValue + delta * progress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
        return;
      }

      animationFrameRef.current = null;
      setAnimatedValue(value);
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [durationMs, value]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return animatedValue;
}
