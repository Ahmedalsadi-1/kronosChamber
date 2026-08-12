import SwiftUI
import WebKit

struct KronosChatView: View {
    var body: some View {
        KronosChamberWebView()
            .background(Color(red: 0.055, green: 0.055, blue: 0.065))
    }
}

private struct KronosChamberWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.keyboardDismissMode = .interactive

        if let indexURL = Bundle.main.url(
            forResource: "index",
            withExtension: "html",
            subdirectory: "kronoschamber"
        ) {
            webView.loadFileURL(indexURL, allowingReadAccessTo: indexURL.deletingLastPathComponent())
        } else {
            webView.loadHTMLString(Self.missingAssetsHTML, baseURL: nil)
        }
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    private static let missingAssetsHTML = """
    <!doctype html>
    <html>
      <meta name='viewport' content='width=device-width,initial-scale=1,viewport-fit=cover'>
      <style>
        html,body{height:100%;margin:0;background:#0e0e11;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
        main{height:100%;display:flex;align-items:center;justify-content:center;padding:28px;box-sizing:border-box}
        section{max-width:520px;text-align:center} h2{font-size:22px;margin:0 0 10px} p{color:#9b9ba3;line-height:1.5}
        code{color:#d7d7dc}
      </style>
      <main><section><h2>KronosChamber</h2><p>The native mobile shell is ready. Build the existing web package and copy its dist output to <code>Resources/kronoschamber</code> to load the original chat design here.</p></section></main>
    </html>
    """
}
