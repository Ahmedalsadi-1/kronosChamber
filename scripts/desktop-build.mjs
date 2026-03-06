#!/usr/bin/env node

import { spawnSync } from "node:child_process"

const hasSigningKey = Boolean(process.env.TAURI_SIGNING_PRIVATE_KEY?.trim())
const args = ["run", "--cwd", "packages/desktop", "tauri", "build"]

if (!hasSigningKey) {
  args.push("--bundles", "app,dmg")
  args.push("--no-sign")
}

const mode = hasSigningKey
  ? "with updater signing enabled"
  : "without updater signing (TAURI_SIGNING_PRIVATE_KEY not set)"

console.log(`[desktop:build] running tauri build ${mode}`)

const result = spawnSync("bun", args, {
  stdio: "inherit",
  env: process.env,
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)
