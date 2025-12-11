/**
 * Initialize Video.js plugins once globally
 * This file ensures plugins are only imported once, preventing re-registration warnings
 * 
 * ES modules are only evaluated once per session, so importing here ensures the plugins
 * are registered before any component uses them.
 * 
 * Note: During hot-reload in development, modules may be re-evaluated, which can cause
 * the re-registration warning. This is harmless and only occurs in development.
 */

// Suppress the re-registration warning from Video.js
// This is safe because we're importing the plugins once at the module level
const originalWarn = console.warn;
const suppressedWarnings = [
  'plugin named "qualityLevels" already exists',
  'A plugin named "qualityLevels" already exists'
];

console.warn = (...args) => {
  // Filter out the qualityLevels re-registration warning
  const message = args[0];
  if (message && typeof message === 'string') {
    const shouldSuppress = suppressedWarnings.some(warning => 
      message.includes(warning)
    );
    if (shouldSuppress) {
      return; // Suppress this specific warning
    }
  }
  originalWarn.apply(console, args);
};

// Import plugins - they will auto-register themselves
// These are top-level imports, so they only execute once per module load
import 'videojs-contrib-quality-levels';
import 'videojs-hls-quality-selector';

// Keep warning suppression active (don't restore immediately)
// The warning only appears during hot-reload in development, which is harmless

