import SwiftUI

struct TerminalTabView: View {
    let onKronosCode: () -> Void

    @StateObject private var shell = LocalShellSession()
    @State private var command = ""
    @State private var history: [String] = []
    @State private var historyIndex: Int?
    @FocusState private var inputFocused: Bool

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    Text(shell.transcript)
                        .font(.system(size: 15, weight: .regular, design: .monospaced))
                        .foregroundStyle(.white)
                        .textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .topLeading)
                        .padding(.horizontal, 16)
                        .padding(.top, 16)

                    Color.clear
                        .frame(height: 1)
                        .id("terminal-bottom")
                }
                .scrollDismissesKeyboard(.interactively)
                .onChange(of: shell.transcript) { _, _ in
                    withAnimation(.easeOut(duration: 0.08)) {
                        proxy.scrollTo("terminal-bottom", anchor: .bottom)
                    }
                }
            }

            Divider().overlay(Color.white.opacity(0.08))

            terminalKeyRow

            HStack(alignment: .firstTextBaseline, spacing: 8) {
                Text(shell.prompt)
                    .font(.system(size: 14, weight: .semibold, design: .monospaced))
                    .foregroundStyle(Color(red: 0.25, green: 0.84, blue: 0.45))
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)

                TextField("", text: $command)
                    .font(.system(size: 15, design: .monospaced))
                    .foregroundStyle(.white)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .submitLabel(.return)
                    .focused($inputFocused)
                    .onSubmit(runCommand)

                if shell.isRunning {
                    ProgressView()
                        .controlSize(.small)
                }
            }
            .padding(.horizontal, 14)
            .frame(minHeight: 48)
            .background(Color.black.opacity(0.26))
        }
        .background(Color(red: 0.035, green: 0.035, blue: 0.042))
        .onAppear {
            shell.onKronosCode = onKronosCode
            inputFocused = true
        }
    }

    private var terminalKeyRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 6) {
                key("esc") { command += "\u{1b}" }
                key("ctrl") { }
                key("tab") { command += "\t" }
                key("~") { command += "~" }
                key("|") { command += "|" }
                key("/") { command += "/" }
                key("-") { command += "-" }
                key("←") { previousHistory() }
                key("↓") { nextHistory() }
                key("↑") { previousHistory() }
                key("→") { nextHistory() }
                key("⌫") {
                    if !command.isEmpty { command.removeLast() }
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
        }
        .background(Color.white.opacity(0.025))
    }

    private func key(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: .medium, design: .monospaced))
                .foregroundStyle(.white.opacity(0.9))
                .frame(minWidth: 36, minHeight: 32)
                .padding(.horizontal, 4)
                .background(
                    RoundedRectangle(cornerRadius: 7, style: .continuous)
                        .fill(Color.white.opacity(0.09))
                )
        }
        .buttonStyle(.plain)
    }

    private func runCommand() {
        let trimmed = command.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        history.append(trimmed)
        historyIndex = nil
        shell.execute(trimmed)
        command = ""
    }

    private func previousHistory() {
        guard !history.isEmpty else { return }
        let next = max(0, (historyIndex ?? history.count) - 1)
        historyIndex = next
        command = history[next]
    }

    private func nextHistory() {
        guard !history.isEmpty, let historyIndex else { return }
        let next = historyIndex + 1
        if next >= history.count {
            self.historyIndex = nil
            command = ""
        } else {
            self.historyIndex = next
            command = history[next]
        }
    }
}
