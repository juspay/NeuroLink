#!/usr/bin/env tsx

/**
 * Format only staged files based on git diff --cached
 * This script gets only staged files (git add'ed) and runs prettier only on those files
 */

import { execSync, execFileSync } from "child_process";
import fs from "fs";
import path from "path";

export function getChangedFiles(): string[] {
  try {
    // Get only staged files (files that have been git add'ed)
    const stagedFiles = execSync("git diff --cached --name-only", {
      encoding: "utf8",
    })
      .split("\n")
      .filter((file: string) => file.trim());

    console.log(`Found ${stagedFiles.length} staged files`);
    return stagedFiles;
  } catch (_error: unknown) {
    console.log("No git repository or no staged files found");
    return [];
  }
}

export function filterFormattableFiles(files: string[]): string[] {
  // Extensions that prettier can format
  const formattableExtensions = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".json",
    ".md",
    ".html",
    ".css",
    ".scss",
    ".less",
    ".vue",
    ".yaml",
    ".yml",
    ".graphql",
    ".gql",
    ".svelte",
  ];

  const formattableFiles = files
    .filter((file: string) => {
      const ext = path.extname(file).toLowerCase();
      return formattableExtensions.includes(ext);
    })
    .filter((file: string) => {
      // Check if file still exists (not deleted)
      try {
        fs.accessSync(file);
        return true;
      } catch {
        return false;
      }
    });

  console.log(`${formattableFiles.length} files can be formatted`);
  return formattableFiles;
}

export function formatFiles(files: string[]): void {
  if (files.length === 0) {
    console.log("No files to format");
    return;
  }

  try {
    console.log("Formatting changed files...");

    // Separate Svelte files (need the plugin) from regular files
    const svelteFiles = files.filter((f: string) => f.endsWith(".svelte"));
    const regularFiles = files.filter((f: string) => !f.endsWith(".svelte"));

    // Format regular files in chunks
    const chunkSize = 50;
    for (let i = 0; i < regularFiles.length; i += chunkSize) {
      const chunk = regularFiles.slice(i, i + chunkSize);

      console.log(
        `Formatting chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(regularFiles.length / chunkSize)}: ${chunk.length} files`,
      );

      execFileSync("npx", ["prettier", "--write", ...chunk], {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    }

    // Format Svelte files with the plugin from the landing workspace
    if (svelteFiles.length > 0) {
      const rootDir = process.cwd();
      const landingDir = path.join(rootDir, "landing");
      // Convert paths to be relative to the landing directory
      const relFiles = svelteFiles.map((f: string) =>
        path.relative(landingDir, path.resolve(rootDir, f)),
      );
      console.log(
        `Formatting ${svelteFiles.length} Svelte files with prettier-plugin-svelte...`,
      );

      execFileSync(
        "npx",
        ["prettier", "--write", "--plugin", "prettier-plugin-svelte", ...relFiles],
        {
          stdio: "inherit",
          cwd: landingDir,
        },
      );
    }

    console.log(`Successfully formatted ${files.length} changed files`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error formatting files:", message);
    process.exit(1);
  }
}

function main(): void {
  console.log("Finding changed files...");

  const changedFiles = getChangedFiles();
  if (changedFiles.length === 0) {
    console.log("No changed files found");
    return;
  }

  const formattableFiles = filterFormattableFiles(changedFiles);
  formatFiles(formattableFiles);
}

// Run if called directly
main();
