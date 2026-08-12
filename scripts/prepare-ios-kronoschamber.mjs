import { cp, mkdir, rm, stat } from "node:fs/promises"
import { resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const candidates = [
  resolve(root, "packages/web/dist"),
  resolve(root, "packages/ui/dist"),
]
const destination = resolve(root, "packages/ios/KronTermMobile/Resources/kronoschamber")

let source
for (const candidate of candidates) {
  try {
    if ((await stat(resolve(candidate, "index.html"))).isFile()) {
      source = candidate
      break
    }
  } catch {}
}

if (!source) {
  console.error("No built KronosChamber index.html found. Run `bun run build:web` first.")
  process.exit(1)
}

await rm(destination, { recursive: true, force: true })
await mkdir(destination, { recursive: true })
await cp(source, destination, { recursive: true })
console.log(`Copied KronosChamber assets from ${source} -> ${destination}`)
