// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "AurigraphSDK",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
    ],
    products: [
        .library(
            name: "AurigraphSDK",
            targets: ["AurigraphSDK"]
        ),
    ],
    targets: [
        .target(
            name: "AurigraphSDK",
            path: "Sources/AurigraphSDK"
        ),
        .testTarget(
            name: "AurigraphSDKTests",
            dependencies: ["AurigraphSDK"],
            path: "Tests/AurigraphSDKTests"
        ),
    ]
)
