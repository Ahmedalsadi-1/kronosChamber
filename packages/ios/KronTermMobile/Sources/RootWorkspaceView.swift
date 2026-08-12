import SwiftUI

struct RootWorkspaceView: View {
    @EnvironmentObject private var workspace: WorkspaceStore
    @State private var showingNewTabMenu = false

    var body: some View {
        ZStack(alignment: .leading) {
            VStack(spacing: 0) {
                header
                tabBar
                Divider().overlay(Color.white.opacity(0.08))
                activeContent
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .background(Color(red: 0.055, green: 0.055, blue: 0.065))

            if workspace.sidebarVisible {
                sidebar
                    .transition(.move(edge: .leading))
                    .zIndex(10)
            }
        }
        .animation(.snappy(duration: 0.22), value: workspace.sidebarVisible)
    }

    private var header: some View {
        HStack {
            Button {
                workspace.sidebarVisible.toggle()
            } label: {
                Image(systemName: "sidebar.left")
                    .font(.system(size: 20, weight: .medium))
                    .frame(width: 48, height: 48)
                    .background(Circle().stroke(Color.white.opacity(0.12)))
            }

            Spacer()
            Text(workspace.activeTab?.title ?? "KronTerm")
                .font(.system(size: 18, weight: .semibold))
                .lineLimit(1)
            Spacer()

            Button {} label: {
                Image(systemName: "bell")
                    .font(.system(size: 20, weight: .medium))
                    .frame(width: 48, height: 48)
                    .background(Circle().stroke(Color.white.opacity(0.12)))
            }
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
    }

    private var tabBar: some View {
        HStack(spacing: 0) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 2) {
                    ForEach(workspace.tabs) { tab in
                        Button {
                            workspace.activate(tab)
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: icon(for: tab.kind))
                                Text(tab.title)
                                    .lineLimit(1)
                                if workspace.tabs.count > 1 {
                                    Image(systemName: "xmark")
                                        .font(.system(size: 11, weight: .semibold))
                                        .onTapGesture { workspace.close(tab) }
                                }
                            }
                            .font(.system(size: 15, weight: .medium))
                            .foregroundStyle(workspace.activeTabID == tab.id ? .white : .secondary)
                            .padding(.horizontal, 14)
                            .frame(height: 46)
                            .background(
                                RoundedRectangle(cornerRadius: 13, style: .continuous)
                                    .fill(workspace.activeTabID == tab.id ? Color.white.opacity(0.055) : .clear)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 13, style: .continuous)
                                            .stroke(workspace.activeTabID == tab.id ? Color.white.opacity(0.12) : .clear)
                                    )
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
            }

            Menu {
                Button("New Terminal", systemImage: "terminal") { workspace.add(.terminal) }
                Button("New Browser", systemImage: "globe") { workspace.add(.browser) }
                Button("Kronos Chat", systemImage: "sparkles") { workspace.add(.chat) }
                Button("Files", systemImage: "folder") { workspace.add(.files) }
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 21))
                    .frame(width: 46, height: 46)
            }
            .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 8)
    }

    @ViewBuilder
    private var activeContent: some View {
        if let tab = workspace.activeTab {
            switch tab.kind {
            case .chat:
                KronosChatView()
            case .terminal:
                TerminalTabView(onKronosCode: workspace.openKronosCode)
            case .browser:
                BrowserTabView(initialURL: tab.browserURL)
            case .files:
                FilesTabView()
            }
        }
    }

    private var sidebar: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Circle().fill(.green).frame(width: 10, height: 10)
                Text("Local")
                    .font(.system(size: 21, weight: .semibold))
                Spacer()
                Button { workspace.add(.terminal) } label: {
                    Image(systemName: "plus")
                        .font(.system(size: 23))
                }
            }
            .padding(.top, 18)

            ForEach(workspace.tabs) { tab in
                Button {
                    workspace.activate(tab)
                    workspace.sidebarVisible = false
                } label: {
                    HStack {
                        Image(systemName: icon(for: tab.kind))
                        Text(tab.title).lineLimit(1)
                        Spacer()
                    }
                    .padding(.horizontal, 16)
                    .frame(height: 48)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(workspace.activeTabID == tab.id ? Color.blue : .clear)
                    )
                }
                .buttonStyle(.plain)
            }
            Spacer()
        }
        .foregroundStyle(.white)
        .padding(.horizontal, 16)
        .frame(width: 285)
        .background(.ultraThinMaterial)
        .overlay(alignment: .trailing) { Divider() }
    }

    private func icon(for kind: WorkspaceStore.TabKind) -> String {
        switch kind {
        case .chat: return "sparkles"
        case .terminal: return "terminal"
        case .browser: return "globe"
        case .files: return "folder"
        }
    }
}
