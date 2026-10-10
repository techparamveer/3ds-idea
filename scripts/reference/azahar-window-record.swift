import Foundation
import AppKit
import ScreenCaptureKit
import AVFoundation
import CoreImage
import ImageIO
import CryptoKit
import Darwin

struct Refusal: Error, CustomStringConvertible {
    let description: String
    init(_ message: String) { description = message }
}
func require(_ condition: Bool, _ message: String) throws {
    if !condition { throw Refusal(message) }
}
struct Bounds: Codable, Equatable {
    let x: Double, y: Double, width: Double, height: Double
    init(_ rect: CGRect) { x = rect.origin.x; y = rect.origin.y; width = rect.width; height = rect.height }
    var rect: CGRect { CGRect(x: x, y: y, width: width, height: height) }
    var valid: Bool { [x,y,width,height].allSatisfy(\.isFinite) && width > 0 && height > 0 }
    static func parse(_ text: String) throws -> Bounds {
        let values = text.split(separator: ",", omittingEmptySubsequences: false).compactMap { Double($0) }
        try require(values.count == 4, "Bounds require x,y,width,height")
        let result = Bounds(CGRect(x: values[0], y: values[1], width: values[2], height: values[3]))
        try require(result.valid, "Invalid bounds")
        return result
    }
}
struct Request: Codable {
    let pid: Int32, windowID: UInt32, displayID: UInt32
    let bundleID: String, executable: String, executableSha256: String
    let displayBounds: Bounds, windowBounds: Bounds
    let seconds: Double, output: String
    func validate() throws {
        try require(pid > 0 && windowID > 0 && displayID > 0, "Positive PID/window/display IDs required")
        try require(!bundleID.isEmpty && !bundleID.contains(where: \.isWhitespace), "Explicit bundle ID required")
        try require(executable.hasPrefix("/") && URL(fileURLWithPath: executable).standardized.path == executable, "Canonical absolute executable required")
        try require(executableSha256.count == 64 && executableSha256.allSatisfy { "0123456789abcdef".contains($0) }, "Lowercase SHA-256 required")
        try require(seconds.isFinite && (2...90).contains(seconds), "Duration must be 2..90 seconds")
        try require(displayBounds.valid && windowBounds.valid && displayBounds.rect.contains(windowBounds.rect), "Window must be wholly inside supplied display bounds")
        try require(output.hasPrefix("/") && output != "/" && URL(fileURLWithPath: output).standardized.path == output, "Canonical unused absolute output directory required")
    }
}
struct Snapshot: Codable {
    let pid: Int32, windowID: UInt32, displayID: UInt32
    let bundleID: String, executable: String, executableSha256: String
    let displayBounds: Bounds, windowBounds: Bounds
    let onScreen: Bool, displayBuiltin: Bool, layer: Int
    let launchTime: Double
}
func validateIdentity(_ actual: Snapshot, _ request: Request, baseline: Snapshot? = nil) throws {
    try require(actual.pid == request.pid && actual.windowID == request.windowID, "Stale or mismatched PID/window")
    try require(actual.bundleID == request.bundleID && actual.executable == request.executable && actual.executableSha256 == request.executableSha256, "Bundle/executable identity mismatch")
    try require(actual.displayID == request.displayID && actual.displayBuiltin && actual.displayBounds == request.displayBounds, "Built-in display identity/bounds mismatch")
    try require(actual.windowBounds == request.windowBounds && actual.onScreen && actual.layer == 0, "Window moved, hidden or wrong layer")
    try require(actual.launchTime.isFinite && actual.launchTime > 0, "Process launch identity unavailable")
    if let baseline { try require(actual.launchTime == baseline.launchTime, "Process replaced during capture") }
}
struct Completion: Codable {
    let started: Bool, finished: Bool, failure: String?
    let videoTracks: Int, audioTracks: Int, width: Int, height: Int
    let expectedWidth: Int, expectedHeight: Int, duration: Double
    func validate() throws {
        try require(started && finished && failure == nil, "Recording not successfully finalized")
        try require(videoTracks == 1 && audioTracks == 0, "Expected one silent video track")
        try require(width == expectedWidth && height == expectedHeight && width > 0 && height > 0, "Movie dimensions mismatch")
        try require(duration.isFinite && duration > 0, "Empty movie duration")
    }
}
struct Fixture: Codable {
    let request: Request, before: Snapshot, after: Snapshot, completion: Completion
    let permissionGranted: Bool, outputExists: Bool
    func validate() throws {
        try request.validate()
        try require(permissionGranted, "Existing screen-capture permission required; no request will be made")
        try require(!outputExists, "Output already exists")
        try validateIdentity(before, request)
        try validateIdentity(after, request, baseline: before)
        try completion.validate()
    }
}
func jsonObject<T: Encodable>(_ value: T) throws -> Any {
    try JSONSerialization.jsonObject(with: JSONEncoder().encode(value))
}
func digest(_ url: URL) throws -> String {
    let file = try FileHandle(forReadingFrom: url)
    defer { try? file.close() }
    var hash = SHA256()
    while let data = try file.read(upToCount: 1_048_576), !data.isEmpty { hash.update(data: data) }
    return hash.finalize().map { String(format: "%02x", $0) }.joined()
}
func snapshot(_ request: Request, knownDigest: String? = nil) throws -> Snapshot {
    guard let app = NSRunningApplication(processIdentifier: request.pid), !app.isTerminated,
          let bundle = app.bundleIdentifier, let executable = app.executableURL,
          let launch = app.launchDate else { throw Refusal("Exact running application unavailable") }
    guard let windows = CGWindowListCopyWindowInfo(.optionIncludingWindow, request.windowID) as? [[String: Any]],
          windows.count == 1, let window = windows.first,
          let pid = window[kCGWindowOwnerPID as String] as? NSNumber,
          let number = window[kCGWindowNumber as String] as? NSNumber,
          let layer = window[kCGWindowLayer as String] as? NSNumber,
          let onScreen = window[kCGWindowIsOnscreen as String] as? Bool,
          let rawBounds = window[kCGWindowBounds as String] as? [String: Any],
          let bounds = CGRect(dictionaryRepresentation: rawBounds as CFDictionary)
    else { throw Refusal("Exact window unavailable") }
    return Snapshot(pid: pid.int32Value, windowID: number.uint32Value, displayID: request.displayID,
                    bundleID: bundle, executable: executable.resolvingSymlinksInPath().path,
                    executableSha256: try knownDigest ?? digest(executable),
                    displayBounds: Bounds(CGDisplayBounds(request.displayID)), windowBounds: Bounds(bounds),
                    onScreen: onScreen, displayBuiltin: CGDisplayIsActive(request.displayID) != 0 && CGDisplayIsBuiltin(request.displayID) != 0,
                    layer: layer.intValue, launchTime: launch.timeIntervalSince1970)
}

// Delegate callbacks and the hard deadline share only lock-protected state.
final class Journal: @unchecked Sendable {
    let directory: URL
    private let lock = NSLock()
    private var data: [String: Any] = ["schema": 1, "status": "preparing", "finalized": false,
        "filter": "desktopIndependentWindow", "capturesAudio": false, "captureMicrophone": false,
        "scopeAcceptance": "unverified; coordinator must open decoded pilot before animation input",
        "nativeTimingAcceptance": false, "rawLcdAcceptance": false]
    init(_ directory: URL) { self.directory = directory }
    func update(_ fields: [String: Any]) throws {
        lock.lock(); defer { lock.unlock() }
        data.merge(fields) { _, new in new }
        let bytes = try JSONSerialization.data(withJSONObject: data, options: [.prettyPrinted, .sortedKeys])
        try bytes.write(to: directory.appendingPathComponent("status.json"), options: .atomic)
    }
}
@available(macOS 15.0, *)
final class Events: NSObject, SCRecordingOutputDelegate, SCStreamDelegate, @unchecked Sendable {
    private let lock = NSLock()
    private var started = false, finished = false
    private var failure: String?
    func state() -> (Bool, Bool, String?) { lock.lock(); defer { lock.unlock() }; return (started, finished, failure) }
    func recordingOutputDidStartRecording(_ recordingOutput: SCRecordingOutput) { lock.lock(); started = true; lock.unlock() }
    func recordingOutputDidFinishRecording(_ recordingOutput: SCRecordingOutput) { lock.lock(); finished = true; lock.unlock() }
    func recordingOutput(_ recordingOutput: SCRecordingOutput, didFailWithError error: Error) { fail(error) }
    func stream(_ stream: SCStream, didStopWithError error: Error) { fail(error) }
    private func fail(_ error: Error) { lock.lock(); failure = String(describing: error); lock.unlock() }
}
@available(macOS 15.0, *)
func waitFor(_ events: Events, finished: Bool) async throws {
    let deadline = ProcessInfo.processInfo.systemUptime + 10
    while ProcessInfo.processInfo.systemUptime < deadline {
        let state = events.state()
        if let error = state.2 { throw Refusal(error) }
        if finished ? state.1 : state.0 { return }
        try await Task.sleep(nanoseconds: 20_000_000)
    }
    throw Refusal(finished ? "Finalization timed out" : "Recording start timed out")
}
func reserveOutput(_ request: Request) throws -> URL {
    let directory = URL(fileURLWithPath: request.output), parent = directory.deletingLastPathComponent()
    var isDirectory: ObjCBool = false
    try require(FileManager.default.fileExists(atPath: parent.path, isDirectory: &isDirectory) && isDirectory.boolValue, "Output parent must already exist")
    try require(parent.resolvingSymlinksInPath().path == parent.path, "Output parent contains symlink")
    try require(mkdir(directory.path, 0o700) == 0, "Refuse existing/uncreatable output directory")
    return directory
}
@available(macOS 15.0, *)
func capture(_ request: Request) async throws {
    try request.validate()
    try require(CGPreflightScreenCaptureAccess(), "Existing screen-capture permission required; no request will be made")
    try require(URL(fileURLWithPath: request.executable).resolvingSymlinksInPath().path == request.executable, "Executable path contains symlink")
    let directory = try reserveOutput(request), journal = Journal(directory)
    try journal.update(["request": try jsonObject(request), "startedAt": Date().timeIntervalSince1970])
    // This process-level deadline also bounds SDK calls which do not return.
    DispatchQueue.global().asyncAfter(deadline: .now() + request.seconds + 30) {
        try? journal.update(["status": "failed", "error": "Hard process deadline exceeded; movie may be partial", "finalized": false])
        fputs("azahar-window-record: hard deadline exceeded\n", stderr)
        exit(124)
    }
    let events = Events()
    var stream: SCStream?
    do {
        let before = try snapshot(request)
        try validateIdentity(before, request)
        try journal.update(["before": try jsonObject(before)])
        let content = try await SCShareableContent.excludingDesktopWindows(true, onScreenWindowsOnly: false)
        let matches = content.windows.filter { $0.windowID == request.windowID }
        try require(matches.count == 1, "Exact SCWindow unavailable; no fallback")
        let window = matches[0]
        try require(window.owningApplication?.processID == request.pid && window.owningApplication?.bundleIdentifier == request.bundleID && Bounds(window.frame) == request.windowBounds && window.windowLayer == 0, "SCWindow identity/bounds mismatch")
        try validateIdentity(snapshot(request, knownDigest: before.executableSha256), request, baseline: before)
        let filter = SCContentFilter(desktopIndependentWindow: window)
        let scale = Double(filter.pointPixelScale)
        try require(scale.isFinite && scale > 0 && Bounds(filter.contentRect).valid && filter.contentRect.width * scale <= 8192 && filter.contentRect.height * scale <= 8192, "Unsupported full-window content scale")
        let width = Int(ceil(filter.contentRect.width * scale)), height = Int(ceil(filter.contentRect.height * scale))
        try require(width > 0 && height > 0 && width <= 8192 && height <= 8192 && width % 2 == 0 && height % 2 == 0, "Unsupported full-window pixel dimensions; no resize fallback")
        let configuration = SCStreamConfiguration()
        configuration.width = width; configuration.height = height
        configuration.captureResolution = .best
        configuration.ignoreShadowsSingleWindow = true
        configuration.includeChildWindows = false
        configuration.showsCursor = false
        configuration.capturesAudio = false; configuration.captureMicrophone = false
        configuration.minimumFrameInterval = CMTime(value: 1, timescale: 60)
        let movie = directory.appendingPathComponent("recording.mp4")
        let recordingConfig = SCRecordingOutputConfiguration()
        recordingConfig.outputURL = movie; recordingConfig.videoCodecType = .h264; recordingConfig.outputFileType = .mp4
        let recording = SCRecordingOutput(configuration: recordingConfig, delegate: events)
        let active = SCStream(filter: filter, configuration: configuration, delegate: events)
        stream = active
        try active.addRecordingOutput(recording)
        try journal.update(["contentRect": try jsonObject(Bounds(filter.contentRect)), "pointPixelScale": scale,
                            "pixelWidth": width, "pixelHeight": height, "showsCursor": false, "includeChildWindows": false,
                            "requestedHostFrameInterval": "1/60 seconds; not native cadence", "codec": "h264"])
        try await active.startCapture()
        try await waitFor(events, finished: false)
        try journal.update(["status": "recording", "recordingStartedAt": Date().timeIntervalSince1970])
        print("recording-started \(directory.path)"); fflush(stdout)
        let until = ProcessInfo.processInfo.systemUptime + request.seconds
        while ProcessInfo.processInfo.systemUptime < until {
            let state = events.state()
            if let error = state.2 { throw Refusal(error) }
            try require(!state.1, "Recording ended before bounded interval")
            try validateIdentity(snapshot(request, knownDigest: before.executableSha256), request, baseline: before)
            try await Task.sleep(nanoseconds: 250_000_000)
        }
        try await active.stopCapture()
        try await waitFor(events, finished: true)
        let after = try snapshot(request)
        try validateIdentity(after, request, baseline: before)
        let asset = AVURLAsset(url: movie)
        let videos = try await asset.loadTracks(withMediaType: .video), audio = try await asset.loadTracks(withMediaType: .audio)
        try require(videos.count == 1 && audio.isEmpty, "Final movie is not one silent video track")
        let size = try await videos[0].load(.naturalSize), duration = try await asset.load(.duration)
        let state = events.state()
        let completion = Completion(started: state.0, finished: state.1, failure: state.2, videoTracks: videos.count, audioTracks: audio.count, width: Int(size.width), height: Int(size.height), expectedWidth: width, expectedHeight: height, duration: CMTimeGetSeconds(duration))
        try completion.validate()
        let reader = try AVAssetReader(asset: asset)
        let output = AVAssetReaderTrackOutput(track: videos[0], outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
        reader.add(output)
        try require(reader.startReading(), "Final movie decoder did not start")
        defer { reader.cancelReading() }
        guard let sample = output.copyNextSampleBuffer(), let pixel = CMSampleBufferGetImageBuffer(sample),
              let image = CIContext().createCGImage(CIImage(cvPixelBuffer: pixel), from: CGRect(x: 0, y: 0, width: width, height: height)) else { throw Refusal("Final movie has no decodable first frame") }
        let png = directory.appendingPathComponent("first-video-frame.png")
        guard let destination = CGImageDestinationCreateWithURL(png as CFURL, "public.png" as CFString, 1, nil) else { throw Refusal("PNG destination failed") }
        CGImageDestinationAddImage(destination, image, nil)
        try require(CGImageDestinationFinalize(destination), "PNG sample failed")
        try journal.update(["status": "complete", "finalized": true, "after": try jsonObject(after), "completion": try jsonObject(completion),
                            "movieSha256": try digest(movie), "firstVideoFrameSha256": try digest(png),
                            "firstVideoFramePts": CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sample)),
                            "sampleProvenance": "PNG decoded from finalized H264 movie, not lossless native LCD or direct screenshot",
                            "finishedAt": Date().timeIntervalSince1970])
        print("recording-finalized \(directory.path)")
    } catch {
        if let stream { try? await stream.stopCapture() }
        let state = events.state()
        try? journal.update(["status": "failed", "error": String(describing: error), "finalized": false,
                             "recordingDelegateStarted": state.0, "recordingDelegateFinished": state.1,
                             "delegateFailure": state.2 ?? NSNull()])
        throw error
    }
}
let usage = """
Silent exact-window recorder, macOS15+. No activation, input, display fallback or permission request.
  azahar-window-record --pid PID --window-id ID --display-id ID --bundle-id BUNDLE
    --executable /absolute/executable --executable-sha256 SHA256
    --display-bounds x,y,width,height --window-bounds x,y,width,height
    --seconds 2..90 --output /absolute/UNUSED-directory
  azahar-window-record --help | --self-test | --validate-fixture /absolute/fixture.json
Offline modes never query screen capture or running applications. The coordinator must inspect
the finalized first-video-frame.png and movie before any animation input. H264 window capture
is not native raw LCD, pixel fidelity, input epoch or cadence acceptance.
"""
func parse(_ args: [String]) throws -> Request {
    let keys: Set<String> = ["--pid","--window-id","--display-id","--bundle-id","--executable","--executable-sha256","--display-bounds","--window-bounds","--seconds","--output"]
    try require(args.count == keys.count * 2, "All explicit recording arguments required")
    var values = [String: String]()
    for index in stride(from: 0, to: args.count, by: 2) {
        try require(keys.contains(args[index]) && values[args[index]] == nil, "Unknown or duplicate argument")
        values[args[index]] = args[index+1]
    }
    guard let pid = Int32(values["--pid"]!), let window = UInt32(values["--window-id"]!), let display = UInt32(values["--display-id"]!), let seconds = Double(values["--seconds"]!) else { throw Refusal("Invalid numeric argument") }
    let request = Request(pid: pid, windowID: window, displayID: display, bundleID: values["--bundle-id"]!, executable: values["--executable"]!, executableSha256: values["--executable-sha256"]!, displayBounds: try Bounds.parse(values["--display-bounds"]!), windowBounds: try Bounds.parse(values["--window-bounds"]!), seconds: seconds, output: values["--output"]!)
    try request.validate()
    return request
}
@main struct Main {
    static func main() async {
        do {
            let args = Array(CommandLine.arguments.dropFirst())
            if args == ["--help"] { print(usage); return }
            if args == ["--self-test"] {
                try require(try Bounds.parse("0,0,1800,1169").valid, "Bounds self-test")
                do { _ = try Bounds.parse("0,0,nan,1"); throw Refusal("Nonfinite self-test did not reject") } catch let error as Refusal { try require(error.description == "Invalid bounds", "Nonfinite rejection self-test") }
                print("{\"mode\":\"offline-self-test\",\"captureAttempted\":false,\"passed\":true}")
                return
            }
            if args.count == 2 && args[0] == "--validate-fixture" {
                try require(args[1].hasPrefix("/"), "Absolute fixture required")
                try JSONDecoder().decode(Fixture.self, from: Data(contentsOf: URL(fileURLWithPath: args[1]))).validate()
                print("{\"mode\":\"offline-fixture\",\"captureAttempted\":false,\"accepted\":true}")
                return
            }
            let request = try parse(args)
            guard #available(macOS 15.0, *) else { throw Refusal("macOS15+ required; no fallback") }
            try await capture(request)
        } catch {
            fputs("azahar-window-record: \(error)\n", stderr)
            exit(1)
        }
    }
}
