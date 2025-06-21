import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function triggerVibration(pattern: number | number[] = 50) {
  if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(pattern);
  }
}

// Generates a short, high-pitched "tick" sound using the Web Audio API.
export function playTick(context: AudioContext) {
  if (context.state === "suspended") {
    context.resume();
  }
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1000, context.currentTime);
  gainNode.gain.setValueAtTime(0.3, context.currentTime); // Lower volume

  gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.05);
  oscillator.start(context.currentTime);
  oscillator.stop(context.currentTime + 0.05);
}

// Generates a two-tone "times up" alert sound using the Web Audio API.
export function playTimesUp(context: AudioContext) {
    if (context.state === "suspended") {
        context.resume();
    }
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, context.currentTime);
    gainNode.gain.setValueAtTime(0.4, context.currentTime);

    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.1);

    gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.3);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
}
