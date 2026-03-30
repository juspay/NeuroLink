/**
 * GCS storage helpers for snapshot and diff pulls.
 */

import { Storage } from "@google-cloud/storage";
import { createWriteStream, mkdirSync } from "node:fs";
import { promises as fs } from "node:fs";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { execFile as execFileCb } from "node:child_process";
import path from "node:path";
import os from "node:os";

const pipe = promisify(pipeline);
const execFile = promisify(execFileCb);

const { GCP_BUCKET_NAME, GCP_BUCKET_NAME_RELEASE, GCS_BASE_PATH, GCS_EXTRA_PATH } = process.env;

const PULL_TIMEOUT_MS = Number(process.env.CHECK_RUNNER_PULL_TIMEOUT_MS || 300_000); // 5 min
const DIFF_ROOT = path.join(os.tmpdir(), "neurolink-diffs");

// ---------------------------------------------------------------------------
// Bucket
// ---------------------------------------------------------------------------

/** @returns {string} */
export function bucketName() {
  const name =
    (GCP_BUCKET_NAME_RELEASE && GCP_BUCKET_NAME_RELEASE.trim()) ||
    (GCP_BUCKET_NAME && GCP_BUCKET_NAME.trim()) ||
    "";
  if (!name) throw new Error("GCP_BUCKET_NAME_RELEASE or GCP_BUCKET_NAME must be set");
  return name;
}

// ---------------------------------------------------------------------------
// Storage key helpers
// ---------------------------------------------------------------------------

/** @param {string} snapshotId */
export function storageKey(snapshotId) {
  if (!GCS_BASE_PATH || !GCS_EXTRA_PATH) throw new Error("GCS_BASE_PATH and GCS_EXTRA_PATH must be set");
  return `${GCS_BASE_PATH}/${GCS_EXTRA_PATH}/snapshots/${snapshotId}`.replace(/\/+/g, "/");
}

/** @returns {string} */
export function snapshotsPrefix() {
  if (!GCS_BASE_PATH || !GCS_EXTRA_PATH) throw new Error("GCS_BASE_PATH and GCS_EXTRA_PATH must be set");
  return `${GCS_BASE_PATH}/${GCS_EXTRA_PATH}/snapshots/`.replace(/\/+/g, "/");
}

/** @param {string} diffId */
export function diffStorageKey(diffId) {
  if (!GCS_BASE_PATH || !GCS_EXTRA_PATH) throw new Error("GCS_BASE_PATH and GCS_EXTRA_PATH must be set");
  return `${GCS_BASE_PATH}/${GCS_EXTRA_PATH}/diffs/${diffId}`.replace(/\/+/g, "/");
}

/** @returns {string} */
export function diffsPrefix() {
  if (!GCS_BASE_PATH || !GCS_EXTRA_PATH) throw new Error("GCS_BASE_PATH and GCS_EXTRA_PATH must be set");
  return `${GCS_BASE_PATH}/${GCS_EXTRA_PATH}/diffs/`.replace(/\/+/g, "/");
}

// ---------------------------------------------------------------------------
// Snapshot resolution — always returns the latest snapshot for a repo
// ---------------------------------------------------------------------------

/**
 * Resolve the snapshot id for a given repo.
 *
 * Naming convention: {repoName}-snapshot-latest.tar.gz
 * A single snapshot per repo, overwritten on every beta build.
 *
 * @param {{ repoName: string }} params
 * @returns {Promise<string>} snapshotId e.g. "lighthouse-snapshot-latest.tar.gz"
 */
export async function resolveSnapshotId({ repoName }) {
  if (!repoName || typeof repoName !== "string" || repoName.trim() === "") {
    throw new Error("repoName is required");
  }

  const snapshotId = `${repoName.trim()}-snapshot-latest.tar.gz`;
  const key = storageKey(snapshotId);

  const [exists] = await gcs().bucket(bucketName()).file(key).exists();
  if (!exists) {
    throw new Error(`No snapshot found for repo '${repoName}' (expected key: ${key})`);
  }

  return snapshotId;
}

// ---------------------------------------------------------------------------
// Diff resolution — find the diff tarball for a repo + branch
// ---------------------------------------------------------------------------

/**
 * Resolve the diff tarball id for a given repo and branch.
 *
 * Naming convention: {repoName}-diff-{branchName}.tar.gz
 * Branch name has / replaced with _ to be filesystem-safe.
 *
 * @param {{ repoName: string; branchRef: string }} params
 * @returns {Promise<string>} diffId e.g. "lighthouse-diff-feat_my-feature.tar.gz"
 */
export async function resolveDiffId({ repoName, branchRef }) {
  if (!repoName || typeof repoName !== "string" || repoName.trim() === "") {
    throw new Error("repoName is required");
  }
  if (!branchRef || typeof branchRef !== "string" || branchRef.trim() === "") {
    throw new Error("branchRef is required");
  }

  const safeBranch = branchRef.trim().replace(/\//g, "_");
  const diffId = `${repoName.trim()}-diff-${safeBranch}.tar.gz`;
  const key = diffStorageKey(diffId);

  // Verify the file exists.
  const [exists] = await gcs().bucket(bucketName()).file(key).exists();
  if (!exists) {
    throw new Error(`No diff found for repo '${repoName}' branch '${branchRef}' (expected key: ${key})`);
  }

  return diffId;
}

// ---------------------------------------------------------------------------
// Diff pull — download and extract the diff tarball
// ---------------------------------------------------------------------------

/** Reject if promise doesn't resolve within ms. */
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/**
 * Download and extract a diff tarball from GCS.
 *
 * @param {string} diffId  e.g. "lighthouse-diff-feat_my-feature.tar.gz"
 * @returns {Promise<string>} absolute path to the extracted directory
 */
export async function pullDiff(diffId) {
  if (!diffId || typeof diffId !== "string") {
    throw new Error("diffId must be a non-empty string");
  }

  mkdirSync(DIFF_ROOT, { recursive: true });

  const safeId = diffId.replace(/\.tar\.gz$/i, "").replace(/[^a-zA-Z0-9_.-]/g, "_");
  const diffDir = path.join(DIFF_ROOT, safeId);
  const archivePath = path.join(DIFF_ROOT, `${safeId}.tar.gz`);

  // Wipe any previous extraction.
  await fs.rm(diffDir, { recursive: true, force: true });
  mkdirSync(diffDir, { recursive: true });

  const key = diffStorageKey(diffId);
  const writeStream = createWriteStream(archivePath);

  try {
    const readStream = gcs().bucket(bucketName()).file(key).createReadStream();
    await withTimeout(pipe(readStream, writeStream), PULL_TIMEOUT_MS, "Diff download");
    await withTimeout(execFile("tar", ["-xzf", archivePath, "-C", diffDir]), PULL_TIMEOUT_MS, "Diff extraction");
  } finally {
    try { await fs.unlink(archivePath); } catch { /* best effort */ }
  }

  return diffDir;
}

// ---------------------------------------------------------------------------
// Lazy GCS client
// ---------------------------------------------------------------------------

/** @type {Storage | null} */
let _gcs = null;

/** @returns {Storage} */
export function gcs() {
  if (!_gcs) _gcs = new Storage();
  return _gcs;
}
