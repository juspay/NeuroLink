/**
 * Shared Configuration for CLI Automation Scripts
 * Centralizes timing, styling, and path constants for consistency
 */

export const AUTOMATION_CONFIG = {
  // Timing Configuration
  delays: {
    betweenActions: 2000,      // Default delay between major actions
    screenshotActions: 1500,   // Faster delay for screenshots
    typing: 100,               // Character-by-character typing delay
    finalWait: 3000           // Wait time before finishing recording
  },

  // Directory Configuration
  directories: {
    videos: 'cli-videos',
    screenshots: 'cli-screenshots'
  },

  // Browser Configuration
  browser: {
    viewport: {
      width: 1920,
      height: 1080
    },
    slowMo: 500,               // Slow motion for video recording
    args: ['--start-maximized']
  },

  // Terminal Styling (shared between scripts)
  terminalStyle: {
    background: '#0d1117',
    terminalBackground: '#161b22',
    border: '#30363d',
    textColor: '#c9d1d9',
    fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace",

    // Color scheme
    colors: {
      primary: '#58a6ff',      // Headers and info
      prompt: '#7c3aed',       // Command prompt
      command: '#79c0ff',      // Commands
      success: '#3fb950',      // Success messages
      error: '#f85149',        // Error messages
      description: '#8b949e',  // Comments and descriptions
      timestamp: '#6e7681',    // Timestamps
      highlight: '#ffa657'     // JSON and highlights
    }
  },

  // Output cleanup patterns
  outputCleanup: {
    ansiCodes: /\x1b\[[0-9;]*m/g,
    spinnerChars: /⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/g,
    emojiSpacing: /🤖|✅|✔|❌|📊|🔍|🎯/g,
    terminalArtifacts: /;[^;]*;[^;]*;[^;]*$/
  }
};

// Helper functions for common operations
export const getDelayForContext = (context = 'default') => {
  const delays = AUTOMATION_CONFIG.delays;
  switch (context) {
    case 'video': return delays.betweenActions;
    case 'screenshot': return delays.screenshotActions;
    case 'typing': return delays.typing;
    case 'final': return delays.finalWait;
    default: return delays.betweenActions;
  }
};

export const cleanCommandOutput = (output) => {
  const patterns = AUTOMATION_CONFIG.outputCleanup;
  return output
    .replace(patterns.ansiCodes, '')
    .replace(patterns.spinnerChars, '')
    .replace(patterns.emojiSpacing, '')
    .replace(patterns.terminalArtifacts, '')
    .trim();
};

export default AUTOMATION_CONFIG;
