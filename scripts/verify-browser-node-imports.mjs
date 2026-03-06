#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const ASSET_DIRS = [
  'packages/web/dist/assets',
  'packages/vscode/dist/webview/assets',
  'packages/desktop/src-tauri/resources/web-dist/assets',
];

const NODE_IMPORT_PATTERNS = [
  /\bimport\s+(?:[^'"]+?\sfrom\s+)?["']node:[^"']+["']/g,
  /\bfrom\s+["']node:[^"']+["']/g,
  /\bimport\s*\(\s*["']node:[^"']+["']\s*\)/g,
];

const jsAssetExtensions = new Set(['.js', '.mjs', '.cjs']);

const pathExists = async (targetPath) => {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
};

const listFilesRecursive = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(absolute)));
      continue;
    }
    if (entry.isFile()) {
      files.push(absolute);
    }
  }

  return files;
};

const lineFromIndex = (text, index) => text.slice(0, index).split('\n').length;

const findNodeImports = (content) => {
  const findings = [];
  for (const pattern of NODE_IMPORT_PATTERNS) {
    pattern.lastIndex = 0;
    let match = pattern.exec(content);
    while (match) {
      findings.push({
        snippet: match[0],
        index: match.index,
      });
      match = pattern.exec(content);
    }
  }
  return findings;
};

const run = async () => {
  const assetDirectories = [];
  const skippedDirectories = [];

  for (const rel of ASSET_DIRS) {
    const absolute = path.resolve(repoRoot, rel);
    if (!(await pathExists(absolute))) {
      skippedDirectories.push(rel);
      continue;
    }
    assetDirectories.push({ rel, absolute });
  }

  if (assetDirectories.length === 0) {
    console.error('[verify-browser-node-imports] No browser bundle directories found.');
    console.error('Build at least one runtime bundle (web, vscode, or desktop sidecar), then re-run verification.');
    process.exit(1);
  }

  const jsAssets = [];
  for (const dir of assetDirectories) {
    const files = await listFilesRecursive(dir.absolute);
    for (const file of files) {
      if (jsAssetExtensions.has(path.extname(file))) {
        jsAssets.push(file);
      }
    }
  }

  if (jsAssets.length === 0) {
    console.error('[verify-browser-node-imports] No JS assets found to verify.');
    process.exit(1);
  }

  const violations = [];

  for (const file of jsAssets) {
    const content = await fs.readFile(file, 'utf8');
    const findings = findNodeImports(content);
    if (findings.length === 0) {
      continue;
    }

    for (const finding of findings) {
      violations.push({
        file: path.relative(repoRoot, file),
        line: lineFromIndex(content, finding.index),
        snippet: finding.snippet.replace(/\s+/g, ' ').trim(),
      });
    }
  }

  if (violations.length > 0) {
    console.error('[verify-browser-node-imports] Detected forbidden node:* imports in browser bundles:');
    for (const violation of violations) {
      console.error(`  - ${violation.file}:${violation.line} -> ${violation.snippet}`);
    }
    process.exit(1);
  }

  if (skippedDirectories.length > 0) {
    console.log('[verify-browser-node-imports] Skipped missing directories:');
    for (const rel of skippedDirectories) {
      console.log(`  - ${rel}`);
    }
  }

  console.log(`[verify-browser-node-imports] OK: scanned ${jsAssets.length} JS assets, no node:* imports found.`);
};

await run();
