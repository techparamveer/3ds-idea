import { mkdirSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

/** Keep local firmware, captures and review evidence on the owner's SSD. */
export function artifactPath(suite) {
  const root = process.env.CODEX_ARTIFACT_DIR
    || '/Volumes/DeveloperStorage/CodexArtifacts/3ds-portfolio/firmware-10.7.0-32E';
  if (!isAbsolute(root)) throw new Error('CODEX_ARTIFACT_DIR must be an absolute path');
  if (!/^[a-z0-9][a-z0-9-]*$/i.test(suite)) throw new Error('Invalid artifact suite');
  const path = join(root, suite);
  mkdirSync(path, { recursive: true });
  return path;
}
