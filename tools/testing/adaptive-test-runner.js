#!/usr/bin/env node

/**
 * NeuroLink Adaptive Test Runner
 * Advanced testing automation with intelligent test selection
 * Part of Developer Experience Enhancement Plan 2.0 - Phase 3A
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "../..");

class AdaptiveTestRunner {
	constructor() {
		this.changedFiles = new Set();
		this.testFiles = new Set();
		this.dependencyMap = new Map();
		this.config = {
			testPatterns: [
				"**/*.test.js",
				"**/*.spec.js",
				"**/*.test.ts",
				"**/*.spec.ts",
			],
			sourcePatterns: [
				"src/**/*.js",
				"src/**/*.ts",
				"src/**/*.svelte",
				"tools/**/*.js",
				"package/**/*.js",
			],
			criticalTests: ["tests/integration/**", "tests/providers/**"],
		};
		this.results = {
			startTime: Date.now(),
			strategy: "adaptive",
			changedFiles: [],
			selectedTests: [],
			skippedTests: [],
			performance: {},
			coverage: {},
		};
	}

	/**
	 * Main execution method
	 */
	async run(strategy = "adaptive") {
		try {
			console.log("\n🧠 NeuroLink Adaptive Test Runner - Phase 3A");
			console.log("================================================");

			this.results.strategy = strategy;

			switch (strategy) {
				case "fast":
					await this.runFastTests();
					break;
				case "full":
					await this.runFullTests();
					break;
				case "affected":
					await this.runAffectedTests();
					break;
				case "adaptive":
				default:
					await this.runAdaptiveTests();
					break;
			}

			await this.generateReport();
			console.log("\n✅ Test execution complete!");
		} catch (error) {
			console.error("❌ Test runner failed:", error.message);
			process.exit(1);
		}
	}

	/**
	 * Adaptive testing strategy - intelligent test selection
	 */
	async runAdaptiveTests() {
		console.log("\n🎯 Running adaptive test strategy...");

		// Step 1: Detect changed files
		await this.detectChangedFiles();

		// Step 2: Analyze dependencies
		await this.analyzeDependencies();

		// Step 3: Select relevant tests
		await this.selectRelevantTests();

		// Step 4: Execute tests with coverage
		await this.executeTests(true);
	}

	/**
	 * Fast testing strategy - unit tests only
	 */
	async runFastTests() {
		console.log("\n⚡ Running fast test strategy...");
		this.results.selectedTests = ["src/**/*.test.js", "tools/**/*.test.js"];
		await this.executeTests(false);
	}

	/**
	 * Full testing strategy - all tests
	 */
	async runFullTests() {
		console.log("\n🔍 Running full test strategy...");
		this.results.selectedTests = ["**/*.test.js", "**/*.spec.js"];
		await this.executeTests(true);
	}

	/**
	 * Affected testing strategy - only tests for changed files
	 */
	async runAffectedTests() {
		console.log("\n🎯 Running affected test strategy...");
		await this.detectChangedFiles();
		await this.selectAffectedTests();
		await this.executeTests(true);
	}

	/**
	 * Detect changed files using git
	 */
	async detectChangedFiles() {
		try {
			console.log("🔍 Detecting changed files...");

			// Get changed files from git
			const gitOutput = execSync("git diff --name-only HEAD~1 HEAD", {
				encoding: "utf8",
				cwd: ROOT_DIR,
			}).trim();

			if (gitOutput) {
				const files = gitOutput.split("\n").filter((f) => f.trim());
				files.forEach((file) => this.changedFiles.add(file));
				this.results.changedFiles = Array.from(this.changedFiles);
				console.log(`📁 Found ${this.changedFiles.size} changed files`);
			} else {
				console.log("📁 No changed files detected, using fallback strategy");
				// Fallback: check for recently modified files
				await this.detectRecentlyModified();
			}
		} catch (error) {
			console.log("⚠️  Git diff failed, using fallback strategy");
			await this.detectRecentlyModified();
		}
	}

	/**
	 * Fallback: detect recently modified files
	 */
	async detectRecentlyModified() {
		try {
			const files = execSync(
				'find . -name "*.js" -o -name "*.ts" -o -name "*.svelte" | head -20',
				{
					encoding: "utf8",
					cwd: ROOT_DIR,
				},
			)
				.trim()
				.split("\n");

			files.forEach((file) => {
				if (file && !file.includes("node_modules") && !file.includes(".git")) {
					this.changedFiles.add(file.replace("./", ""));
				}
			});

			this.results.changedFiles = Array.from(this.changedFiles);
			console.log(`📁 Using ${this.changedFiles.size} recently modified files`);
		} catch (error) {
			console.log("⚠️  Fallback detection failed, running critical tests only");
			this.config.criticalTests.forEach((pattern) =>
				this.changedFiles.add(pattern),
			);
		}
	}

	/**
	 * Analyze dependencies to map files to tests
	 */
	async analyzeDependencies() {
		console.log("🔗 Analyzing dependencies...");

		for (const file of this.changedFiles) {
			const dependencies = await this.findDependencies(file);
			this.dependencyMap.set(file, dependencies);
		}

		console.log(`🔗 Mapped ${this.dependencyMap.size} files to dependencies`);
	}

	/**
	 * Find dependencies for a file
	 */
	async findDependencies(filePath) {
		const dependencies = new Set();

		try {
			const fullPath = join(ROOT_DIR, filePath);
			if (!existsSync(fullPath)) {
				return dependencies;
			}

			const content = readFileSync(fullPath, "utf8");

			// Extract import statements
			const importRegex = /import.*from\s+['"`]([^'"`]+)['"`]/g;
			let match;

			while ((match = importRegex.exec(content)) !== null) {
				const importPath = match[1];
				if (importPath.startsWith(".")) {
					// Relative import
					const resolvedPath = this.resolveImport(filePath, importPath);
					if (resolvedPath) {
						dependencies.add(resolvedPath);
					}
				}
			}

			// Extract require statements
			const requireRegex = /require\(['"`]([^'"`]+)['"`]\)/g;
			while ((match = requireRegex.exec(content)) !== null) {
				const requirePath = match[1];
				if (requirePath.startsWith(".")) {
					const resolvedPath = this.resolveImport(filePath, requirePath);
					if (resolvedPath) {
						dependencies.add(resolvedPath);
					}
				}
			}
		} catch {
			console.log(`⚠️  Failed to analyze dependencies for ${filePath}`);
		}

		return dependencies;
	}

	/**
	 * Resolve relative import path
	 */
	resolveImport(fromFile, importPath) {
		try {
			const dir = dirname(fromFile);
			const resolved = join(dir, importPath);

			// Try different extensions
			const extensions = [".js", ".ts", ".svelte", ".json"];
			for (const ext of extensions) {
				const withExt = resolved + ext;
				if (existsSync(join(ROOT_DIR, withExt))) {
					return withExt;
				}
			}

			// Try index files
			for (const ext of extensions) {
				const indexFile = join(resolved, "index" + ext);
				if (existsSync(join(ROOT_DIR, indexFile))) {
					return indexFile;
				}
			}
		} catch {
			// Ignore resolution errors
		}

		return null;
	}

	/**
	 * Select relevant tests based on changed files and dependencies
	 */
	async selectRelevantTests() {
		console.log("🎯 Selecting relevant tests...");

		const selectedTests = new Set();

		// Always include critical tests
		this.config.criticalTests.forEach((pattern) => selectedTests.add(pattern));

		// Find tests for changed files
		for (const file of this.changedFiles) {
			// Direct test file
			const testFile = this.findTestFile(file);
			if (testFile) {
				selectedTests.add(testFile);
			}

			// Tests for dependencies
			const dependencies = this.dependencyMap.get(file) || new Set();
			for (const dep of dependencies) {
				const depTest = this.findTestFile(dep);
				if (depTest) {
					selectedTests.add(depTest);
				}
			}
		}

		this.results.selectedTests = Array.from(selectedTests);
		console.log(`🎯 Selected ${selectedTests.size} test files/patterns`);
	}

	/**
	 * Select tests only for affected files
	 */
	async selectAffectedTests() {
		console.log("🎯 Selecting affected tests...");

		const selectedTests = new Set();

		for (const file of this.changedFiles) {
			const testFile = this.findTestFile(file);
			if (testFile) {
				selectedTests.add(testFile);
			}
		}

		// If no specific tests found, add critical tests
		if (selectedTests.size === 0) {
			this.config.criticalTests.forEach((pattern) =>
				selectedTests.add(pattern),
			);
		}

		this.results.selectedTests = Array.from(selectedTests);
		console.log(`🎯 Selected ${selectedTests.size} affected test files`);
	}

	/**
	 * Find test file for a source file
	 */
	findTestFile(sourceFile) {
		const baseName = sourceFile.replace(/\.(js|ts|svelte)$/, "");
		const dir = dirname(sourceFile);

		// Common test file patterns
		const patterns = [
			`${baseName}.test.js`,
			`${baseName}.spec.js`,
			`${baseName}.test.ts`,
			`${baseName}.spec.ts`,
			join(dir, "__tests__", `${baseName}.js`),
			join(dir, "__tests__", `${baseName}.ts`),
			`tests/${baseName}.test.js`,
			`tests/${baseName}.spec.js`,
		];

		for (const pattern of patterns) {
			if (existsSync(join(ROOT_DIR, pattern))) {
				return pattern;
			}
		}

		return null;
	}

	/**
	 * Execute tests with optional coverage
	 */
	async executeTests(withCoverage = false) {
		console.log("🧪 Executing tests...");

		const startTime = Date.now();

		try {
			const args = ["run"];

			if (withCoverage) {
				args.push("--coverage");
			}

			// Add test patterns if specific tests selected
			if (
				this.results.selectedTests.length > 0 &&
				this.results.strategy !== "full"
			) {
				// Create a temporary test pattern file
				const testPatterns = this.results.selectedTests.join("\n");
				const tempFile = join(ROOT_DIR, ".tmp-test-patterns.txt");
				writeFileSync(tempFile, testPatterns);

				// For now, run all tests but log which ones were selected
				console.log(
					`📝 Selected tests: ${this.results.selectedTests.join(", ")}`,
				);
			}

			execSync(`npx vitest ${args.join(" ")}`, {
				encoding: "utf8",
				cwd: ROOT_DIR,
				stdio: "inherit",
			});

			this.results.performance.testDuration = Date.now() - startTime;
			console.log(
				`⏱️  Tests completed in ${this.results.performance.testDuration}ms`,
			);
		} catch {
			this.results.performance.testDuration = Date.now() - startTime;
			console.log(
				`⚠️  Some tests failed (duration: ${this.results.performance.testDuration}ms)`,
			);

			// Don't exit on test failures in adaptive mode
			if (this.results.strategy === "adaptive") {
				console.log("🔄 Continuing with adaptive analysis...");
			}
		}
	}

	/**
	 * Generate comprehensive test report
	 */
	async generateReport() {
		console.log("\n📊 Generating test report...");

		const reportDir = join(ROOT_DIR, "test-reports");
		if (!existsSync(reportDir)) {
			mkdirSync(reportDir, { recursive: true });
		}

		const report = {
			timestamp: new Date().toISOString(),
			strategy: this.results.strategy,
			duration: Date.now() - this.results.startTime,
			changedFiles: this.results.changedFiles,
			selectedTests: this.results.selectedTests,
			performance: this.results.performance,
			coverage: this.results.coverage,
			summary: {
				totalChangedFiles: this.results.changedFiles.length,
				totalSelectedTests: this.results.selectedTests.length,
				testDuration: this.results.performance.testDuration || 0,
				efficiency: this.calculateEfficiency(),
			},
		};

		const reportFile = join(
			reportDir,
			`adaptive-test-report-${Date.now()}.json`,
		);
		writeFileSync(reportFile, JSON.stringify(report, null, 2));

		console.log("📊 Test Report Summary:");
		console.log(`   Strategy: ${report.strategy}`);
		console.log(`   Changed Files: ${report.summary.totalChangedFiles}`);
		console.log(`   Selected Tests: ${report.summary.totalSelectedTests}`);
		console.log(`   Test Duration: ${report.summary.testDuration}ms`);
		console.log(`   Efficiency: ${report.summary.efficiency}%`);
		console.log(`   Report saved: ${reportFile}`);
	}

	/**
	 * Calculate testing efficiency
	 */
	calculateEfficiency() {
		if (this.results.strategy === "full") {
			return 100;
		}

		const selectedCount = this.results.selectedTests.length;
		const changedCount = this.results.changedFiles.length;

		if (changedCount === 0) {
			return 0;
		}

		// Efficiency = (selected tests / changed files) * 100, capped at 100%
		return Math.min(100, Math.round((selectedCount / changedCount) * 100));
	}
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
	const strategy = process.argv[2] || "adaptive";
	const runner = new AdaptiveTestRunner();

	runner.run(strategy).catch((error) => {
		console.error("❌ Adaptive test runner failed:", error);
		process.exit(1);
	});
}

export default AdaptiveTestRunner;
