#!/usr/bin/env python3
"""Visual verification script for NeuroLink documentation site.

Requires: pip install playwright && playwright install chromium

Usage: python scripts/visual-verification.py
"""

from playwright.sync_api import sync_playwright
import os
from pathlib import Path

# Get the project root (parent of scripts folder)
SCRIPT_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = SCRIPT_DIR.parent.parent  # docs-site/../
SCREENSHOT_DIR = PROJECT_ROOT / "docs-screenshots"
BASE_URL = os.environ.get("DOCS_URL", "http://localhost:3000")

# Pages to verify
PAGES = [
    ("/", "landing-page"),
    ("/docs", "docs-homepage"),
    ("/docs/getting-started", "getting-started"),
    ("/docs/sdk", "sdk-reference"),
    ("/docs/cli", "cli-guide"),
    ("/docs/examples", "examples"),
    ("/docs/features/multimodal", "feature-multimodal"),
    ("/docs/features/mcp-tools-showcase", "feature-mcp"),
]

# Viewport sizes
DESKTOP_VIEWPORT = {"width": 1440, "height": 900}
MOBILE_VIEWPORT = {"width": 375, "height": 812}  # iPhone X


def ensure_dir():
    os.makedirs(SCREENSHOT_DIR, exist_ok=True)
    os.makedirs(SCREENSHOT_DIR / "desktop", exist_ok=True)
    os.makedirs(SCREENSHOT_DIR / "mobile", exist_ok=True)


def verify_page(page, url, name, viewport_name, viewport):
    """Verify a page loads correctly and take screenshot."""
    page.set_viewport_size(viewport)
    full_url = f"{BASE_URL}{url}"

    try:
        response = page.goto(full_url, wait_until="networkidle", timeout=30000)
        page.wait_for_load_state("networkidle")

        status = response.status if response else "No response"

        # Take screenshot
        screenshot_path = SCREENSHOT_DIR / viewport_name / f"{name}.png"
        page.screenshot(path=str(screenshot_path), full_page=True)

        # Get page title
        title = page.title()

        # Check for error content
        content = page.content()
        has_404 = "404" in content and ("not found" in content.lower() or "page not found" in content.lower())

        print(f"✓ {viewport_name.upper()} | {url}")
        print(f"  Status: {status} | Title: {title[:50]}...")
        print(f"  Screenshot: {screenshot_path}")

        if has_404:
            print("  ⚠ WARNING: Page may contain 404 content")

        return {"url": url, "status": status, "title": title, "has_404": has_404, "screenshot": str(screenshot_path)}

    except Exception as e:
        print(f"✗ {viewport_name.upper()} | {url}")
        print(f"  Error: {str(e)}")
        return {"url": url, "status": "error", "error": str(e)}


def main():
    ensure_dir()
    print("=" * 60)
    print("NEUROLINK DOCUMENTATION - VISUAL VERIFICATION")
    print("=" * 60)
    print(f"Base URL: {BASE_URL}")
    print(f"Screenshots: {SCREENSHOT_DIR}")

    results = {"desktop": [], "mobile": []}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Desktop viewport tests
        print("\n--- DESKTOP VIEWPORT (1440x900) ---\n")
        for url, name in PAGES:
            result = verify_page(page, url, name, "desktop", DESKTOP_VIEWPORT)
            results["desktop"].append(result)

        # Mobile viewport tests
        print("\n--- MOBILE VIEWPORT (375x812) ---\n")
        for url, name in PAGES:
            result = verify_page(page, url, name, "mobile", MOBILE_VIEWPORT)
            results["mobile"].append(result)

        # Verify interactive elements on landing page
        print("\n--- INTERACTIVE ELEMENTS TEST ---\n")
        page.set_viewport_size(DESKTOP_VIEWPORT)
        page.goto(f"{BASE_URL}/", wait_until="networkidle")

        # Check CTA buttons
        cta_primary = page.locator("a:has-text('Get Started')").first
        if cta_primary.is_visible():
            href = cta_primary.get_attribute("href")
            print(f"✓ 'Get Started' button found: {href}")
        else:
            print("✗ 'Get Started' button not found")

        # Check Documentation link
        doc_link = page.locator("a:has-text('Documentation')").first
        if doc_link.is_visible():
            href = doc_link.get_attribute("href")
            print(f"✓ 'Documentation' link found: {href}")
        else:
            print("✗ 'Documentation' link not found")

        # Check navbar links
        navbar = page.locator("nav")
        if navbar.is_visible():
            print("✓ Navbar is visible")
        else:
            print("✗ Navbar not visible")

        browser.close()

    # Summary
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)

    desktop_ok = sum(1 for r in results["desktop"] if r.get("status") == 200)
    mobile_ok = sum(1 for r in results["mobile"] if r.get("status") == 200)
    total_pages = len(PAGES)

    print(f"Desktop: {desktop_ok}/{total_pages} pages loaded successfully")
    print(f"Mobile: {mobile_ok}/{total_pages} pages loaded successfully")
    print(f"\nScreenshots saved to: {SCREENSHOT_DIR}")


if __name__ == "__main__":
    main()
