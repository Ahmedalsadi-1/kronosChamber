import SwiftUI
import WebKit

struct BrowserTabView: View {
    @State private var address: String
    @State private var currentURL: URL
    @State private var reloadToken = UUID()

    init(initialURL: URL?) {
        let url = initialURL ?? URL(string: "https://www.google.com")!
        _currentURL = State(initialValue: url)
        _address = State(initialValue: url.absoluteString)
    }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 10) {
                Button {
                    reloadToken = UUID()
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .frame(width: 38, height: 38)
                        .background(Circle().stroke(Color.white.opacity(0.12)))
                }

                TextField("Search on Google or enter URL", text: $address)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .keyboardType(.URL)
                    .submitLabel(.go)
                    .onSubmit { navigate() }
                    .padding(.horizontal, 16)
                    .frame(height: 40)
                    .background(
                        Capsule().fill(Color.white.opacity(0.035))
                            .overlay(Capsule().stroke(Color.white.opacity(0.12)))
                    )
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 18)
            .padding(.vertical, 10)

            WebView(url: currentURL, reloadToken: reloadToken)
        }
        .background(Color.black.opacity(0.28))
    }

    private func navigate() {
        let trimmed = address.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        if let explicit = URL(string: trimmed), explicit.scheme != nil {
            currentURL = explicit
            return
        }

        if trimmed.contains(".") && !trimmed.contains(" "), let url = URL(string: "https://\(trimmed)") {
            currentURL = url
            address = url.absoluteString
            return
        }

        var components = URLComponents(string: "https://www.google.com/search")!
        components.queryItems = [URLQueryItem(name: "q", value: trimmed)]
        if let url = components.url {
            currentURL = url
            address = url.absoluteString
        }
    }
}

private struct WebView: UIViewRepresentable {
    let url: URL
    let reloadToken: UUID

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.allowsBackForwardNavigationGestures = true
        view.isOpaque = false
        view.backgroundColor = .clear
        view.scrollView.keyboardDismissMode = .interactive
        view.load(URLRequest(url: url))
        return view
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        if webView.url != url {
            webView.load(URLRequest(url: url))
        } else if context.coordinator.lastReloadToken != reloadToken {
            context.coordinator.lastReloadToken = reloadToken
            webView.reload()
        }
    }

    func makeCoordinator() -> Coordinator { Coordinator(reloadToken: reloadToken) }

    final class Coordinator {
        var lastReloadToken: UUID
        init(reloadToken: UUID) { self.lastReloadToken = reloadToken }
    }
}
