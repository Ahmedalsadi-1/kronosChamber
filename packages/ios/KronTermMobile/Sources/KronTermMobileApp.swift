import SwiftUI

@main
struct KronTermMobileApp: App {
    @StateObject private var workspace = WorkspaceStore()

    var body: some Scene {
        WindowGroup {
            RootWorkspaceView()
                .environmentObject(workspace)
                .preferredColorScheme(.dark)
        }
    }
}
