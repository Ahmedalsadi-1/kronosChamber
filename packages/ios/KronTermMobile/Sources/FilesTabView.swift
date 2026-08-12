import SwiftUI

struct FilesTabView: View {
    @State private var entries: [URL] = []
    @State private var errorMessage: String?

    private var root: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("workspace", isDirectory: true)
    }

    var body: some View {
        NavigationStack {
            List(entries, id: \.path) { url in
                HStack(spacing: 12) {
                    Image(systemName: isDirectory(url) ? "folder.fill" : "doc")
                        .foregroundStyle(isDirectory(url) ? .blue : .secondary)
                    Text(url.lastPathComponent)
                        .font(.system(.body, design: .monospaced))
                }
                .listRowBackground(Color.clear)
            }
            .scrollContentBackground(.hidden)
            .background(Color(red: 0.055, green: 0.055, blue: 0.065))
            .navigationTitle("~/workspace")
            .navigationBarTitleDisplayMode(.inline)
            .overlay {
                if let errorMessage {
                    ContentUnavailableView("Files unavailable", systemImage: "exclamationmark.triangle", description: Text(errorMessage))
                } else if entries.isEmpty {
                    ContentUnavailableView("Empty workspace", systemImage: "folder", description: Text("Clone or create a project from the Terminal tab."))
                }
            }
        }
        .task { reload() }
    }

    private func reload() {
        do {
            try FileManager.default.createDirectory(at: root, withIntermediateDirectories: true)
            entries = try FileManager.default.contentsOfDirectory(
                at: root,
                includingPropertiesForKeys: [.isDirectoryKey],
                options: [.skipsHiddenFiles]
            ).sorted { lhs, rhs in
                if isDirectory(lhs) != isDirectory(rhs) { return isDirectory(lhs) }
                return lhs.lastPathComponent.localizedStandardCompare(rhs.lastPathComponent) == .orderedAscending
            }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func isDirectory(_ url: URL) -> Bool {
        (try? url.resourceValues(forKeys: [.isDirectoryKey]).isDirectory) ?? false
    }
}
