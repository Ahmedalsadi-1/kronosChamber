import Foundation
import Darwin
import ios_system

@MainActor
final class LocalShellSession: ObservableObject {
    @Published var transcript = "KronTerm local iOS shell\nType `kronoscode` to open KronosCode.\n\n"
    @Published var currentDirectory: URL
    @Published var isRunning = false

    private let workspaceRoot: URL
    var onKronosCode: (() -> Void)?

    init() {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        workspaceRoot = documents.appendingPathComponent("workspace", isDirectory: true)
        currentDirectory = workspaceRoot

        try? FileManager.default.createDirectory(at: workspaceRoot, withIntermediateDirectories: true)
        setenv("HOME", documents.path, 1)
        setenv("PATH", "\(documents.path)/bin:/usr/bin:/bin", 1)
        initializeEnvironment()
        _ = ios_setMiniRoot(workspaceRoot.path as NSString)
        FileManager.default.changeCurrentDirectoryPath(workspaceRoot.path)
    }

    var prompt: String {
        let relative = currentDirectory.path.replacingOccurrences(of: workspaceRoot.path, with: "")
        return relative.isEmpty ? "kronterm:~/workspace$" : "kronterm:~/workspace\(relative)$"
    }

    func execute(_ rawCommand: String) {
        let command = rawCommand.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !command.isEmpty, !isRunning else { return }

        transcript += "\(prompt) \(command)\n"

        if command == "clear" {
            transcript = ""
            return
        }

        if command == "kronoscode" || command.hasPrefix("kronoscode ") {
            transcript += "Opening KronosCode…\n"
            onKronosCode?()
            return
        }

        if command == "pwd" {
            transcript += "\(currentDirectory.path)\n"
            return
        }

        if command == "help" {
            transcript += "Built-ins: cd, pwd, clear, kronoscode\nNative iOS commands are provided by ios_system.\n"
            return
        }

        if command == "cd" || command.hasPrefix("cd ") {
            changeDirectory(command)
            return
        }

        isRunning = true
        let workingDirectory = currentDirectory
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            FileManager.default.changeCurrentDirectoryPath(workingDirectory.path)
            let result = Self.capture(command)
            DispatchQueue.main.async {
                guard let self else { return }
                self.transcript += result
                if !result.hasSuffix("\n") { self.transcript += "\n" }
                self.isRunning = false
            }
        }
    }

    private func changeDirectory(_ command: String) {
        let argument = command.dropFirst(2).trimmingCharacters(in: .whitespaces)
        let destination: URL

        if argument.isEmpty || argument == "~" {
            destination = workspaceRoot
        } else if argument.hasPrefix("/") {
            destination = URL(fileURLWithPath: argument)
        } else {
            destination = currentDirectory.appendingPathComponent(argument).standardizedFileURL
        }

        let rootPath = workspaceRoot.standardizedFileURL.path
        guard destination.standardizedFileURL.path.hasPrefix(rootPath) else {
            transcript += "cd: outside the mobile workspace is blocked\n"
            return
        }

        var isDir: ObjCBool = false
        guard FileManager.default.fileExists(atPath: destination.path, isDirectory: &isDir), isDir.boolValue else {
            transcript += "cd: no such directory: \(argument)\n"
            return
        }

        currentDirectory = destination
        FileManager.default.changeCurrentDirectoryPath(destination.path)
    }

    nonisolated private static func capture(_ command: String) -> String {
        var collected = ""
        command.withCString { commandCString in
            "r".withCString { modeCString in
                guard let pipe = ios_popen(commandCString, modeCString) else {
                    collected = "kronterm: command could not be started\n"
                    return
                }
                var buffer = [CChar](repeating: 0, count: 4096)
                while fgets(&buffer, Int32(buffer.count), pipe) != nil {
                    collected += String(cString: buffer)
                }
                fclose(pipe)
            }
        }
        return collected.isEmpty ? "" : collected
    }
}
