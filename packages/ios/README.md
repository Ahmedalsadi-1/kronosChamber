# KronTerm Mobile (iOS)

Native iPhone shell for KronosChamber with browser, terminal, files, and chat tabs.

## Architecture

- **Existing KronosChamber UI remains the chat surface.** The iOS app hosts the existing built web UI in a `WKWebView` rather than redesigning it.
- **Browser tabs** are native `WKWebView` instances with a compact address bar.
- **Terminal tabs** execute commands on the iPhone through [`holzschu/ios_system`](https://github.com/holzschu/ios_system). This is the same native command layer used by a-Shell/Blink-style iOS terminals; it does not require a remote computer.
- **Terminal rendering** uses [`SwiftTerm`](https://github.com/migueldeicaza/SwiftTerm).
- **Files** are rooted in the app's Documents workspace and are intended to expand to security-scoped Files app bookmarks.
- Typing **`kronoscode`** in a local terminal is intercepted as a first-class KronTerm command and immediately opens the KronosCode/KronosChamber agent surface.

## Important runtime boundary

KronosCode's current CLI is a Bun monorepo and declares `bun@1.3.9`. Stock Bun/desktop CLI binaries cannot simply be executed inside an App Store iOS sandbox. The mobile app therefore treats `kronoscode` as a native command bridge instead of trying to launch the desktop Bun executable. Local file/shell operations stay on-device; the agent UI is KronosChamber.

This is different from iSH: iSH emulates 32-bit x86 Linux, which is useful as a Linux shell but is the wrong architecture for modern arm64/x64-only agent binaries. For KronTerm Mobile, the native `ios_system` route is faster and fits the iOS app sandbox better.

## Generate the Xcode project

This folder uses XcodeGen so the Xcode project does not need to be hand-maintained.

```bash
brew install xcodegen
cd packages/ios
xcodegen generate
open KronTermMobile.xcodeproj
```

The project currently targets iOS 17+.

## KronosChamber web assets

Build the existing web app at repository root:

```bash
bun install
bun run build:web
```

Then copy the generated web assets into `packages/ios/KronTermMobile/Resources/kronoschamber/` before an archive build. The app will load `index.html` from that bundle. During early development, `KronosChatView` displays a clear fallback if assets have not been copied yet.

## Next implementation steps

1. Wire the exact `packages/web/dist` output path into an Xcode build phase.
2. Add the desired `ios_system` command frameworks (`files`, `shell`, `curl`, `ssh_cmd`, etc.) as embedded products.
3. Connect KronosChamber's agent API bridge to the iOS local workspace adapter.
4. Add Git UI and security-scoped workspace bookmarks.
5. Add split-pane state matching the desktop KronTerm behavior.
6. Add signing/CI for installable iPhone builds.
