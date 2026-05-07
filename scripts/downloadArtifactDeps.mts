/**
 * Downloads the static assets required by the iframe artifact renderer.
 * Run once from a machine with internet access; deploy public/artifact-deps/
 * to your intranet server alongside the app.
 *
 * Usage:
 *   bun run download:artifact-deps          # skip files that already exist
 *   bun run download:artifact-deps --force  # re-download everything
 *
 * Why React 18?
 *   React 19 removed UMD builds. React 18 ships proper browser-ready UMD at
 *   unpkg and is fully sufficient for artifact rendering (hooks, forwardRef, etc.)
 */

import { access, constants, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DEPS_DIR = join(process.cwd(), 'public', 'artifact-deps');
const FORCE = process.argv.includes('--force');

const green = (s: string) => `\x1B[32m${s}\x1B[0m`;
const yellow = (s: string) => `\x1B[33m${s}\x1B[0m`;
const red = (s: string) => `\x1B[31m${s}\x1B[0m`;

async function fileExists(p: string) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

async function downloadFile(url: string, dest: string, label: string) {
  if (!FORCE && (await fileExists(dest))) {
    console.log(yellow(`  skip  ${label} (already exists)`));
    return;
  }
  process.stdout.write(`  fetch  ${label} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log(green(' ✓'));
}

/**
 * Downloads the lucide-react pre-built CJS bundle from unpkg and wraps it in an
 * IIFE with a tiny require() shim so it runs without a module system.
 * React is provided via window.React (the React 18 UMD global).
 *
 * We download the pre-built CJS instead of bundling from node_modules to avoid
 * the "Identifier already declared" error that appears when a flat CJS bundler
 * inlines many ESM icon modules that each declare `let Component`.
 */
async function downloadLucideReact(dest: string) {
  if (!FORCE && (await fileExists(dest))) {
    console.log(yellow('  skip  lucide-react (already exists)'));
    return;
  }
  process.stdout.write('  fetch  lucide-react (CJS + IIFE wrap) ...');

  // unpkg resolves the package `main` field → the pre-compiled single-file CJS bundle.
  const cjs = await fetchText('https://unpkg.com/lucide-react/dist/cjs/lucide-react.js');

  // Wrap in IIFE with a minimal require() shim.
  // window.React must be loaded (React 18 UMD) before this script.
  const wrapped =
    `(function(){` +
    `var require=function(m){` +
    `if(m==="react"||m==="react/jsx-runtime")return window.React;` +
    `throw new Error("lucide-react: unknown module "+m);` +
    `};` +
    `var module={exports:{}};var exports=module.exports;\n` +
    cjs +
    `\nwindow.LucideReact=module.exports;` +
    `})();`;

  await writeFile(dest, wrapped);
  console.log(green(' ✓'));
}

async function main() {
  await mkdir(DEPS_DIR, { recursive: true });
  console.log(`\nDownloading artifact renderer deps → ${DEPS_DIR}\n`);

  // React 18 UMD — sets window.React
  await downloadFile(
    'https://unpkg.com/react@18/umd/react.production.min.js',
    join(DEPS_DIR, 'react.production.min.js'),
    'react@18 (UMD)',
  );

  // ReactDOM 18 UMD — sets window.ReactDOM (includes createRoot)
  await downloadFile(
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    join(DEPS_DIR, 'react-dom.production.min.js'),
    'react-dom@18 (UMD)',
  );

  // recharts 2 UMD — bundles d3 + lodash; expects window.React + window.ReactDOM
  await downloadFile(
    'https://unpkg.com/recharts@2/umd/Recharts.js',
    join(DEPS_DIR, 'recharts.min.js'),
    'recharts@2 (UMD)',
  );

  await downloadFile(
    'https://unpkg.com/prop-types@15.8.1/prop-types.min.js',
    join(DEPS_DIR, 'prop-types.min.js'),
    'prop-types',
  );

  // lucide-react — pre-built CJS wrapped as IIFE
  await downloadLucideReact(join(DEPS_DIR, 'lucide-react.min.js'));

  // Babel standalone — JSX + TypeScript transform in-browser
  await downloadFile(
    'https://unpkg.com/@babel/standalone/babel.min.js',
    join(DEPS_DIR, 'babel.min.js'),
    '@babel/standalone',
  );

  // Tailwind Play CDN — scans DOM classes and injects CSS at runtime
  await downloadFile(
    'https://cdn.tailwindcss.com',
    join(DEPS_DIR, 'tailwind.cdn.js'),
    'tailwind play CDN',
  );

  console.log(`\n${green('All done!')} Files written to public/artifact-deps/\n`);
  console.log('Next steps:');
  console.log('  1. Add NEXT_PUBLIC_ARTIFACT_RENDERER_MODE=iframe to your .env');
  console.log('  2. Redeploy — the iframe renderer is now active.\n');
}

main().catch((e) => {
  console.error(red('\nError: ') + (e instanceof Error ? e.message : String(e)));
  process.exit(1);
});
