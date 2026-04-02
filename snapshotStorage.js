/**
 * GCS storage helpers for snapshot pulls.
 */

import { Storage } from "@google-cloud/storage";

const { GCP_BUCKET_NAME, GCP_BUCKET_NAME_RELEASE, GCS_BASE_PATH, GCS_EXTRA_PATH } = process.env;

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
// Lazy GCS client
// ---------------------------------------------------------------------------

/** @type {Storage | null} */
let _gcs = null;

/** @returns {Storage} */
export function gcs() {
  if (!_gcs) _gcs = new Storage();
  return _gcs;
}
