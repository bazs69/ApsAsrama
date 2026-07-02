/**
 * Motion System Tokens
 * 
 * Central source of truth for transitions, easing, and speeds.
 * Uses motion-reduce utility to respect user system preferences.
 */

export const motion = {
  // CSS Transition utility classes combining speed, easing, and prefers-reduced-motion support
  fast: "transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
  normal: "transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
  slow: "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none",
  
  // Transform scaling effects for hover and active micro-interactions
  scaleHover: "hover:scale-[1.01] motion-reduce:hover:scale-100",
  scalePress: "active:scale-[0.98] motion-reduce:active:scale-100",
  
  // Standard CSS raw values if needed for inline styles
  raw: {
    durationFast: 150,
    durationNormal: 200,
    durationSlow: 300,
    easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  }
}
