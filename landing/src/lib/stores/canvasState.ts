import { writable, derived } from "svelte/store";

// Which landing section is currently in view
export const activeSection = writable<string>("hero");
export const scrollProgress = writable<number>(0); // 0–1
export const scrollVelocity = writable<number>(0); // pixels/frame, smoothed

// Per-section canvas configuration
export interface SectionCanvasConfig {
  intensity: number;
  particleSpeed: number;
  branchGrowth: number;
  signalDensity: number;
  dominantColor: string;
  glowNodes: boolean;
  spinalActivity: number;
}

const SECTION_CONFIGS: Record<string, SectionCanvasConfig> = {
  hero: {
    intensity: 0.4,
    particleSpeed: 1,
    branchGrowth: 2,
    signalDensity: 8,
    dominantColor: "#00d2ff",
    glowNodes: false,
    spinalActivity: 1,
  },
  streams: {
    intensity: 0.6,
    particleSpeed: 2,
    branchGrowth: 4,
    signalDensity: 20,
    dominantColor: "#00f0ff",
    glowNodes: false,
    spinalActivity: 1.5,
  },
  features: {
    intensity: 0.6,
    particleSpeed: 2,
    branchGrowth: 4,
    signalDensity: 20,
    dominantColor: "#00f0ff",
    glowNodes: false,
    spinalActivity: 1.5,
  },
  pipe: {
    intensity: 0.7,
    particleSpeed: 1.5,
    branchGrowth: 4,
    signalDensity: 15,
    dominantColor: "#00d2ff",
    glowNodes: false,
    spinalActivity: 2,
  },
  connectors: {
    intensity: 0.8,
    particleSpeed: 1,
    branchGrowth: 5,
    signalDensity: 10,
    dominantColor: "#ff9100",
    glowNodes: true,
    spinalActivity: 1.2,
  },
  developer: {
    intensity: 0.5,
    particleSpeed: 1.5,
    branchGrowth: 3,
    signalDensity: 12,
    dominantColor: "#00f0ff",
    glowNodes: false,
    spinalActivity: 1.2,
  },
  cta: {
    intensity: 0.3,
    particleSpeed: 0.5,
    branchGrowth: 3,
    signalDensity: 5,
    dominantColor: "#00d2ff",
    glowNodes: false,
    spinalActivity: 0.8,
  },
};

const DEFAULT_CONFIG: SectionCanvasConfig = SECTION_CONFIGS.hero;

// Derived store: current canvas config based on active section
export const canvasConfig = derived(
  activeSection,
  ($activeSection) => SECTION_CONFIGS[$activeSection] ?? DEFAULT_CONFIG,
);
