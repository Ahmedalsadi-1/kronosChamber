import Foundation

@MainActor
final class WorkspaceStore: ObservableObject {
    enum TabKind: String, Codable {
        case chat
        case terminal
        case browser
        case files
    }

    struct Tab: Identifiable, Equatable {
        let id: UUID
        var kind: TabKind
        var title: String
        var browserURL: URL?

        init(id: UUID = UUID(), kind: TabKind, title: String, browserURL: URL? = nil) {
            self.id = id
            self.kind = kind
            self.title = title
            self.browserURL = browserURL
        }
    }

    @Published var tabs: [Tab] = [
        Tab(kind: .chat, title: "Kronos"),
        Tab(kind: .terminal, title: "Terminal")
    ]
    @Published var activeTabID: UUID?
    @Published var sidebarVisible = false

    init() {
        activeTabID = tabs.first?.id
    }

    var activeTab: Tab? {
        guard let activeTabID else { return tabs.first }
        return tabs.first(where: { $0.id == activeTabID })
    }

    func activate(_ tab: Tab) {
        activeTabID = tab.id
    }

    func add(_ kind: TabKind) {
        let tab: Tab
        switch kind {
        case .chat:
            tab = Tab(kind: .chat, title: "Kronos")
        case .terminal:
            tab = Tab(kind: .terminal, title: "Terminal")
        case .browser:
            tab = Tab(kind: .browser, title: "New tab", browserURL: URL(string: "https://www.google.com"))
        case .files:
            tab = Tab(kind: .files, title: "Files")
        }
        tabs.append(tab)
        activeTabID = tab.id
    }

    func close(_ tab: Tab) {
        guard tabs.count > 1 else { return }
        let index = tabs.firstIndex(of: tab)
        tabs.removeAll { $0.id == tab.id }
        if activeTabID == tab.id {
            activeTabID = tabs[min(index ?? 0, tabs.count - 1)].id
        }
    }

    func openKronosCode() {
        if let existing = tabs.first(where: { $0.kind == .chat }) {
            activeTabID = existing.id
        } else {
            add(.chat)
        }
    }
}
