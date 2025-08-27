import { describe, test, expect, beforeEach, afterEach } from "vitest";
import {
  createProxyFetch,
  getProxyStatus,
} from "../../src/lib/proxy/proxyFetch.js";

describe("Enhanced Proxy Support", () => {
  beforeEach(() => {
    // Clear environment
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.ALL_PROXY;
    delete process.env.SOCKS_PROXY;
    delete process.env.NO_PROXY;
  });

  afterEach(() => {
    // Clean up environment
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.ALL_PROXY;
    delete process.env.SOCKS_PROXY;
    delete process.env.NO_PROXY;
  });

  describe("Proxy Status Detection", () => {
    test("should detect no proxy when none configured", () => {
      const status = getProxyStatus();
      expect(status.enabled).toBe(false);
      expect(status.method).toBe("enhanced-proxy-agent");
      expect(status.capabilities).toContain("SOCKS4/SOCKS5 Proxy");
    });

    test("should detect HTTP proxy", () => {
      process.env.HTTP_PROXY = "http://proxy.example.com:8080";

      const status = getProxyStatus();
      expect(status.enabled).toBe(true);
      expect(status.httpProxy).toBe("http://proxy.example.com:8080");
      expect(status.httpsProxy).toBe(null);
    });

    test("should detect HTTPS proxy", () => {
      process.env.HTTPS_PROXY = "https://proxy.example.com:8080";

      const status = getProxyStatus();
      expect(status.enabled).toBe(true);
      expect(status.httpsProxy).toBe("https://proxy.example.com:8080");
    });

    test("should detect ALL_PROXY", () => {
      process.env.ALL_PROXY = "http://proxy.example.com:8080";

      const status = getProxyStatus();
      expect(status.enabled).toBe(true);
      expect(status.allProxy).toBe("http://proxy.example.com:8080");
    });

    test("should detect SOCKS proxy", () => {
      process.env.SOCKS_PROXY = "socks5://proxy.example.com:1080";

      const status = getProxyStatus();
      expect(status.enabled).toBe(true);
      expect(status.socksProxy).toBe("socks5://proxy.example.com:1080");
    });

    test("should detect NO_PROXY configuration", () => {
      process.env.HTTP_PROXY = "http://proxy.example.com:8080";
      process.env.NO_PROXY = "localhost,.example.com,192.168.1.0/24";

      const status = getProxyStatus();
      expect(status.enabled).toBe(true);
      expect(status.noProxy).toBe("localhost,.example.com,192.168.1.0/24");
    });
  });

  describe("Proxy Fetch Creation", () => {
    test("should return standard fetch when no proxy configured", () => {
      const proxyFetch = createProxyFetch();
      expect(proxyFetch).toBe(fetch);
    });

    test("should return enhanced fetch function when proxy configured", () => {
      process.env.HTTP_PROXY = "http://proxy.example.com:8080";

      const proxyFetch = createProxyFetch();
      expect(proxyFetch).not.toBe(fetch);
      expect(typeof proxyFetch).toBe("function");
    });

    test("should return enhanced fetch for SOCKS proxy", () => {
      process.env.SOCKS_PROXY = "socks5://proxy.example.com:1080";

      const proxyFetch = createProxyFetch();
      expect(proxyFetch).not.toBe(fetch);
      expect(typeof proxyFetch).toBe("function");
    });
  });

  describe("Enhanced Capabilities", () => {
    test("should include all expected capabilities", () => {
      const status = getProxyStatus();
      const expectedCapabilities = [
        "HTTP/HTTPS Proxy",
        "SOCKS4/SOCKS5 Proxy",
        "Proxy Authentication",
        "NO_PROXY Bypass",
        "CIDR Range Matching",
        "Wildcard Domain Matching",
      ];

      expectedCapabilities.forEach((capability) => {
        expect(status.capabilities).toContain(capability);
      });
    });

    test("should use enhanced-proxy-agent method", () => {
      const status = getProxyStatus();
      expect(status.method).toBe("enhanced-proxy-agent");
    });
  });

  describe("Environment Variable Priority", () => {
    test("should handle multiple proxy types simultaneously", () => {
      process.env.HTTP_PROXY = "http://http-proxy.example.com:8080";
      process.env.HTTPS_PROXY = "https://https-proxy.example.com:8080";
      process.env.ALL_PROXY = "http://all-proxy.example.com:8080";
      process.env.SOCKS_PROXY = "socks5://socks-proxy.example.com:1080";

      const status = getProxyStatus();
      expect(status.enabled).toBe(true);
      expect(status.httpProxy).toBe("http://http-proxy.example.com:8080");
      expect(status.httpsProxy).toBe("https://https-proxy.example.com:8080");
      expect(status.allProxy).toBe("http://all-proxy.example.com:8080");
      expect(status.socksProxy).toBe("socks5://socks-proxy.example.com:1080");
    });

    test("should handle case-insensitive environment variables", () => {
      process.env.https_proxy = "http://lowercase-proxy.example.com:8080";

      const status = getProxyStatus();
      expect(status.enabled).toBe(true);
      expect(status.httpsProxy).toBe("http://lowercase-proxy.example.com:8080");
    });
  });
});

describe("NO_PROXY Bypass Logic", () => {
  beforeEach(() => {
    delete process.env.NO_PROXY;
    delete process.env.no_proxy;
  });

  // Note: These tests validate the interface but require mocking for full functionality
  // since the bypass logic is internal to the fetch function

  test("should handle wildcard NO_PROXY", () => {
    process.env.HTTP_PROXY = "http://proxy.example.com:8080";
    process.env.NO_PROXY = "*";

    const status = getProxyStatus();
    expect(status.noProxy).toBe("*");
  });

  test("should handle domain suffix NO_PROXY", () => {
    process.env.HTTP_PROXY = "http://proxy.example.com:8080";
    process.env.NO_PROXY = ".company.com,.local";

    const status = getProxyStatus();
    expect(status.noProxy).toBe(".company.com,.local");
  });

  test("should handle CIDR NO_PROXY", () => {
    process.env.HTTP_PROXY = "http://proxy.example.com:8080";
    process.env.NO_PROXY = "192.168.1.0/24,10.0.0.0/8";

    const status = getProxyStatus();
    expect(status.noProxy).toBe("192.168.1.0/24,10.0.0.0/8");
  });

  test("should handle mixed NO_PROXY patterns", () => {
    process.env.HTTP_PROXY = "http://proxy.example.com:8080";
    process.env.NO_PROXY =
      "localhost,.company.com,192.168.1.0/24,specific.host.com:8080";

    const status = getProxyStatus();
    expect(status.noProxy).toBe(
      "localhost,.company.com,192.168.1.0/24,specific.host.com:8080",
    );
  });
});

describe("Proxy Authentication Support", () => {
  test("should handle proxy URLs with authentication", () => {
    process.env.HTTP_PROXY = "http://user:pass@proxy.example.com:8080";

    const status = getProxyStatus();
    expect(status.enabled).toBe(true);
    expect(status.httpProxy).toBe("http://user:pass@proxy.example.com:8080");
  });

  test("should handle SOCKS proxy with authentication", () => {
    process.env.SOCKS_PROXY = "socks5://user:pass@socks-proxy.example.com:1080";

    const status = getProxyStatus();
    expect(status.enabled).toBe(true);
    expect(status.socksProxy).toBe(
      "socks5://user:pass@socks-proxy.example.com:1080",
    );
  });

  test("should handle URL-encoded credentials", () => {
    process.env.HTTP_PROXY =
      "http://user%40domain:p%40ssw0rd@proxy.example.com:8080";

    const status = getProxyStatus();
    expect(status.enabled).toBe(true);
    expect(status.httpProxy).toBe(
      "http://user%40domain:p%40ssw0rd@proxy.example.com:8080",
    );
  });
});
