/**
 * Extract client version from User-Agent header
 * Supports formats:
 * - cronus-electron-app/1.3.2
 * - Cronus/1.7.1
 * - cronus-electron-app/1.3.2 Chrome/134.0.6998.179 Electron/35.1.5 Safari/537.36
 */
export function extractClientVersion(userAgent?: string): string | null {
  if (!userAgent) return null;

  // Match patterns like "cronus-electron-app/1.3.2" or "Cronus/1.7.1"
  const versionMatch = userAgent.match(/(?:cronus-electron-app|Cronus)\/(\d+\.\d+\.\d+)/i);

  return versionMatch ? versionMatch[1] : null;
}

/**
 * Compare version strings (semver format: x.y.z)
 * Returns:
 * - 1 if version1 > version2
 * - -1 if version1 < version2
 * - 0 if equal
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  return 0;
}

/**
 * Check if a version is outdated compared to minimum required version
 */
export function isVersionOutdated(currentVersion: string, minimumVersion: string): boolean {
  return compareVersions(currentVersion, minimumVersion) < 0;
}
