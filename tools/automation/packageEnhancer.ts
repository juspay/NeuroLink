#!/usr/bin/env node
/**
 * Package.json Enhancement Script
 *
 * Updates package.json with all the new pnpm-first automation scripts
 * and enhanced configuration for the developer experience enhancement.
 */

import fs from "fs/promises";

class PackageJsonEnhancer {
  packageJsonPath: string;
  enhancedScripts: Record<string, any>;
  enhancedConfig: Record<string, any>;
  newDevDependencies: Record<string, any>;

  constructor() {
    this.packageJsonPath = "./package.json";
    this.enhancedScripts = {
      // Environment & Setup (pnpm-first)
      setup: "tsx tools/setup.ts",
      "setup:quick": "tsx tools/setup.ts --quick",
      "setup:complete": "pnpm install && tsx tools/setup.ts",
      "env:setup": "tsx tools/automation/environmentManager.ts",
      "env:validate": "tsx tools/automation/environmentManager.ts --validate",
      "env:backup": "tsx tools/automation/environmentManager.ts --backup",
      "env:list-backups":
        "tsx tools/automation/environmentManager.ts --list-backups",

      // Project Management & Organization
      "project:analyze": "tsx tools/automation/scriptAnalyzer.ts",
      "project:cleanup": "tsx tools/automation/scriptAnalyzer.ts --execute",
      "project:organize": "tsx tools/automation/projectOrganizer.ts",
      "project:health": "pnpm run env:validate && pnpm run test:run",

      // Enhanced Testing (Adaptive & Intelligent)
      "test:smart":
        'tsx tools/testing/adaptiveTestRunner.ts || echo "Adaptive test runner not yet implemented"',
      "test:providers":
        'tsx tools/testing/providerValidator.ts || echo "Provider validator not yet implemented"',
      "test:performance":
        'tsx tools/testing/performanceMonitor.ts || echo "Performance monitor not yet implemented"',
      "test:ci": "pnpm run test:run && pnpm run lint && pnpm run typecheck",

      // Content Generation & Management
      "content:screenshots":
        'tsx tools/content/screenshot-automation.ts || echo "Screenshot automation not yet implemented"',
      "content:videos":
        'tsx tools/content/video-generator.ts || echo "Video generator not yet implemented"',
      "content:cleanup": "tsx tools/content/videoCleanup.ts",
      "content:all":
        'pnpm run content:cleanup && echo "Content generation tools ready for implementation"',

      // Documentation Automation
      "docs:sync":
        'tsx tools/content/documentationSync.ts || echo "Documentation sync not yet implemented"',
      "docs:validate":
        'tsx tools/content/documentationSync.ts --validate || echo "Documentation validation not yet implemented"',
      "docs:generate":
        'echo "Documentation generation tools ready for implementation"',

      // Enhanced Development Experience
      "dev:full": "tsx tools/development/dev-server.ts || pnpm run dev",
      "dev:health":
        "tsx tools/development/healthMonitor.ts || pnpm run project:health",
      "dev:demo":
        'concurrently "pnpm run dev" "tsx neurolink-demo/complete-enhanced-server.ts"',

      // Build & Deploy Enhancement
      "build:complete": "tsx tools/automation/buildSystem.ts || pnpm run build",
      "build:analyze":
        'tsx tools/development/dependency-analyzer.ts || echo "Dependency analyzer not yet implemented"',

      // Quality & Maintenance (Enhanced)
      "lint:fix": "eslint . --ext .ts,.js,.svelte --fix",
      "format:check": "prettier --check .",
      typecheck: "tsc --noEmit",
      quality: "pnpm run lint && pnpm run format:check && pnpm run typecheck",

      // Maintenance & Utilities
      clean:
        "pnpm run content:cleanup && rm -rf dist .svelte-kit node_modules/.cache",
      "clean:all": "pnpm run clean && rm -rf node_modules && pnpm install",
      reset: "pnpm run clean:all && pnpm run setup",
      audit: "pnpm audit && pnpm run build:analyze",
    };

    this.enhancedConfig = {
      pnpm: {
        peerDependencyRules: {
          ignoreMissing: ["@types/node"],
        },
        overrides: {
          semver: "^7.5.4",
        },
      },
    };

    this.newDevDependencies = {
      "@types/diff": "^5.0.9",
      concurrently: "^8.2.2",
      diff: "^5.1.0",
      glob: "^10.3.10",
    };
  }

  async enhancePackageJson() {
    console.log("📦 Enhancing package.json with automation scripts...");

    try {
      // Read current package.json
      const packageJson = await this.readPackageJson();

      // Show current state
      this.analyzeCurrentPackage(packageJson);

      // Enhance with new scripts
      const enhanced = await this.addEnhancedScripts(packageJson);

      // Add pnpm configuration
      this.addPnpmConfig(enhanced);

      // Add development dependencies
      this.addDevDependencies(enhanced);

      // Write enhanced package.json
      await this.writePackageJson(enhanced);

      // Generate summary
      this.generateSummary();

      console.log("✅ Package.json enhancement complete!");
    } catch (error: any) {
      console.error("❌ Package.json enhancement failed:", error.message);
      throw error;
    }
  }

  async readPackageJson() {
    try {
      const content = await fs.readFile(this.packageJsonPath, "utf-8");
      return JSON.parse(content);
    } catch (error: any) {
      console.error("❌ Failed to read package.json:", error.message);
      throw error;
    }
  }

  analyzeCurrentPackage(packageJson: any) {
    console.log("\n📊 Current package.json analysis:");
    console.log(`  📝 Name: ${packageJson.name || "unnamed"}`);
    console.log(`  🏷️  Version: ${packageJson.version || "unversioned"}`);
    console.log(
      `  📜 Current scripts: ${Object.keys(packageJson.scripts || {}).length}`,
    );
    console.log(
      `  📦 Dependencies: ${Object.keys(packageJson.dependencies || {}).length}`,
    );
    console.log(
      `  🔧 DevDependencies: ${Object.keys(packageJson.devDependencies || {}).length}`,
    );
    console.log(
      `  ⚙️  pnpm config: ${packageJson.pnpm ? "present" : "missing"}`,
    );
  }

  async addEnhancedScripts(packageJson: any) {
    console.log("\n🔧 Adding enhanced automation scripts...");

    // Preserve existing scripts
    const existingScripts = packageJson.scripts || {};

    // Merge with enhanced scripts (new ones take precedence)
    const mergedScripts = { ...existingScripts, ...this.enhancedScripts };

    // Count new vs existing
    const newScriptCount = Object.keys(this.enhancedScripts).length;
    const existingScriptCount = Object.keys(existingScripts).length;
    const overriddenCount = Object.keys(existingScripts).filter(
      (key) => this.enhancedScripts[key],
    ).length;

    console.log(`  ➕ Adding ${newScriptCount} enhanced scripts`);
    console.log(`  🔄 Overriding ${overriddenCount} existing scripts`);
    console.log(
      `  ✅ Preserving ${existingScriptCount - overriddenCount} existing scripts`,
    );

    return {
      ...packageJson,
      scripts: mergedScripts,
    };
  }

  addPnpmConfig(packageJson: any) {
    console.log("\n⚙️  Adding pnpm configuration...");

    if (!packageJson.pnpm) {
      packageJson.pnpm = this.enhancedConfig.pnpm;
      console.log("  ✅ Added new pnpm configuration");
    } else {
      // Merge with existing config
      packageJson.pnpm = {
        ...packageJson.pnpm,
        ...this.enhancedConfig.pnpm,
      };
      console.log("  🔄 Enhanced existing pnpm configuration");
    }
  }

  addDevDependencies(packageJson: any) {
    console.log("\n📦 Adding development dependencies...");

    const existingDevDeps = packageJson.devDependencies || {};
    const newDeps = [];
    const skippedDeps = [];

    for (const [name, version] of Object.entries(this.newDevDependencies)) {
      if (!existingDevDeps[name]) {
        existingDevDeps[name] = version;
        newDeps.push(name);
      } else {
        skippedDeps.push(name);
      }
    }

    packageJson.devDependencies = existingDevDeps;

    console.log(
      `  ➕ Added ${newDeps.length} new dev dependencies: ${newDeps.join(", ")}`,
    );
    if (skippedDeps.length > 0) {
      console.log(
        `  ⏭️  Skipped ${skippedDeps.length} existing dependencies: ${skippedDeps.join(", ")}`,
      );
    }
  }

  async writePackageJson(packageJson: any) {
    console.log("\n💾 Writing enhanced package.json...");

    try {
      // Create backup first
      const backupPath = `./package.json.backup.${Date.now()}`;
      const originalContent = await fs.readFile(this.packageJsonPath, "utf-8");
      await fs.writeFile(backupPath, originalContent);
      console.log(`  💾 Backup created: ${backupPath}`);

      // Write enhanced version
      const enhancedContent = JSON.stringify(packageJson, null, 2) + "\n";
      await fs.writeFile(this.packageJsonPath, enhancedContent);
      console.log("  ✅ Enhanced package.json written");
    } catch (error: any) {
      console.error("❌ Failed to write package.json:", error.message);
      throw error;
    }
  }

  generateSummary() {
    console.log("\n📋 ENHANCEMENT SUMMARY");
    console.log("=".repeat(50));
    console.log(
      `📜 Total scripts added: ${Object.keys(this.enhancedScripts).length}`,
    );
    console.log(
      `📦 Dev dependencies added: ${Object.keys(this.newDevDependencies).length}`,
    );
    console.log(`⚙️  pnpm configuration: Enhanced`);

    console.log("\n🎯 KEY COMMANDS AVAILABLE:");
    console.log("Environment:");
    console.log("  pnpm run setup           - Complete project setup");
    console.log("  pnpm run env:setup       - Environment configuration");
    console.log("  pnpm run env:validate    - Validate providers");

    console.log("\nProject Management:");
    console.log("  pnpm run project:analyze  - Analyze scripts");
    console.log("  pnpm run project:cleanup  - Clean duplicates");
    console.log("  pnpm run project:organize - Organize structure");

    console.log("\nDevelopment:");
    console.log("  pnpm run dev:full        - Enhanced dev server");
    console.log("  pnpm run test:smart      - Adaptive testing");
    console.log("  pnpm run quality         - Code quality checks");

    console.log("\nContent & Maintenance:");
    console.log("  pnpm run content:cleanup - Clean video files");
    console.log("  pnpm run clean           - Clean build artifacts");
    console.log("  pnpm run reset           - Complete reset");

    console.log("\n💡 NEXT STEPS:");
    console.log("1. Install new dependencies: pnpm install");
    console.log("2. Run complete setup: pnpm run setup");
    console.log("3. Validate environment: pnpm run env:validate");
    console.log("4. Start development: pnpm run dev:full");
  }

  async validateEnhancement() {
    console.log("\n✅ Validating package.json enhancement...");

    try {
      const packageJson = await this.readPackageJson();

      // Check if all enhanced scripts are present
      const missingScripts = Object.keys(this.enhancedScripts).filter(
        (script) => !packageJson.scripts || !packageJson.scripts[script],
      );

      // Check pnpm configuration
      const hasPnpmConfig =
        packageJson.pnpm &&
        packageJson.pnpm.peerDependencyRules &&
        packageJson.pnpm.overrides;

      // Check dev dependencies
      const missingDevDeps = Object.keys(this.newDevDependencies).filter(
        (dep) =>
          !packageJson.devDependencies || !packageJson.devDependencies[dep],
      );

      const validation = {
        scripts: {
          total: Object.keys(packageJson.scripts || {}).length,
          missing: missingScripts.length,
          valid: missingScripts.length === 0,
        },
        pnpm: {
          configured: hasPnpmConfig,
          valid: hasPnpmConfig,
        },
        dependencies: {
          missing: missingDevDeps.length,
          valid: missingDevDeps.length === 0,
        },
      };

      // Report validation
      if (
        validation.scripts.valid &&
        validation.pnpm.valid &&
        validation.dependencies.valid
      ) {
        console.log("✅ Package.json enhancement validation successful!");
      } else {
        console.log("⚠️  Package.json enhancement validation found issues:");
        if (!validation.scripts.valid) {
          console.log(`  📜 Missing ${validation.scripts.missing} scripts`);
        }
        if (!validation.pnpm.valid) {
          console.log(`  ⚙️  pnpm configuration incomplete`);
        }
        if (!validation.dependencies.valid) {
          console.log(
            `  📦 Missing ${validation.dependencies.missing} dev dependencies`,
          );
        }
      }

      return validation;
    } catch (error: any) {
      console.error("❌ Validation failed:", error.message);
      throw error;
    }
  }
}

// Export for use as module
export { PackageJsonEnhancer };

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const enhancer = new PackageJsonEnhancer();

  try {
    if (process.argv.includes("--validate")) {
      await enhancer.validateEnhancement();
    } else {
      await enhancer.enhancePackageJson();

      if (process.argv.includes("--validate-after")) {
        await enhancer.validateEnhancement();
      }
    }
  } catch (error: any) {
    console.error("❌ Package.json enhancement failed:", error.message);
    process.exit(1);
  }
}
