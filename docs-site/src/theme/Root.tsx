import React, { useEffect } from "react";
import { useLocation } from "@docusaurus/router";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import posthog from "posthog-js";

// Check for user consent (GDPR compliance)
function checkUserConsent(): boolean {
  if (typeof window === "undefined") return false;

  // Check localStorage for consent preference
  const consent = localStorage.getItem("posthog-consent");

  // Default to opt-out for GDPR compliance (user must explicitly opt-in)
  return consent === "true";
}

// Initialize PostHog with privacy-compliant configuration
function initPostHog(apiKey: string, host: string) {
  if (typeof window === "undefined") return;

  posthog.init(apiKey, {
    api_host: host,
    // Privacy-compliant autocapture settings
    autocapture: true,
    capture_pageview: false, // We handle this manually for SPA navigation
    capture_pageleave: true,

    // Privacy-compliant session recording with masking
    enable_recording_console_log: false, // ✅ Disable console capture
    session_recording: {
      maskAllInputs: true, // ✅ Mask all user inputs
      maskTextSelector: "*", // ✅ Mask all text content
    },

    // Heatmaps and performance tracking
    enable_heatmaps: true,
    capture_performance: true,

    // Persistence settings
    persistence: "localStorage+cookie",
    cross_subdomain_cookie: true,

    // Respect Do Not Track header
    respect_dnt: true, // ✅ Respect Do Not Track

    // Additional tracking options
    property_denylist: [], // Don't deny any properties
    loaded: (posthogInstance) => {
      // Check for user consent before identifying
      const hasUserConsent = checkUserConsent();
      if (!hasUserConsent) {
        posthogInstance.opt_out_capturing();
        return;
      }

      if (!window.location.host.includes("localhost")) {
        posthogInstance.identify("docs-user");
      }
    },
  });
}

// Track page views on route change
function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined" || !posthog.__loaded) return;

    // Capture pageview with full URL details
    posthog.capture("$pageview", {
      $current_url: window.location.href,
      $pathname: location.pathname,
      $search: location.search,
      $hash: location.hash,
      $host: window.location.host,
      $referrer: document.referrer,
      $screen_height: window.screen.height,
      $screen_width: window.screen.width,
      $viewport_height: window.innerHeight,
      $viewport_width: window.innerWidth,
      title: document.title,
    });
  }, [location.pathname, location.search, location.hash]);
}

export default function Root({ children }: { children: React.ReactNode }) {
  const { siteConfig } = useDocusaurusContext();
  const { posthogApiKey, posthogHost } = siteConfig.customFields as {
    posthogApiKey?: string;
    posthogHost?: string;
  };

  // Initialize PostHog on mount
  useEffect(() => {
    if (posthogApiKey) {
      initPostHog(posthogApiKey, posthogHost || "https://us.i.posthog.com");
    }
  }, [posthogApiKey, posthogHost]);

  // Track page views on route changes
  usePageTracking();

  return <>{children}</>;
}
