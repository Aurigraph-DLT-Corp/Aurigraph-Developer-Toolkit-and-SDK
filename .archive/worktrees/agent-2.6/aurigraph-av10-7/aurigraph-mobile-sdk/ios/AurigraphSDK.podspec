Pod::Spec.new do |spec|
  spec.name                   = "AurigraphSDK"
  spec.version               = "11.0.0"
  spec.summary               = "Aurigraph DLT Mobile SDK for iOS"
  spec.description           = <<-DESC
                             A comprehensive mobile SDK for Aurigraph DLT V11 providing blockchain 
                             functionality with quantum-resistant cryptography, AI-driven consensus,
                             and cross-chain interoperability.
                             DESC

  spec.homepage              = "https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT"
  spec.license               = { :type => "MIT", :file => "LICENSE" }
  spec.author                = { "Aurigraph DLT Corp" => "dev@aurigraph.io" }
  
  spec.platform              = :ios, "14.0"
  spec.swift_version         = "5.8"
  
  spec.source                = { :git => "https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git", :tag => "#{spec.version}" }
  spec.source_files          = "ios/Sources/**/*.swift"
  spec.resource_bundles      = { 'AurigraphSDK' => ['ios/Resources/**/*'] }
  
  spec.dependency 'gRPC-Swift', '~> 1.18'
  spec.dependency 'SwiftProtobuf', '~> 1.21'
  spec.dependency 'CryptoKit'
  spec.dependency 'LocalAuthentication'
  
  spec.frameworks = 'Foundation', 'Security', 'CryptoKit', 'LocalAuthentication'
  
  spec.requires_arc = true
  
  spec.test_spec 'Tests' do |test_spec|
    test_spec.source_files = 'ios/Tests/**/*.swift'
    test_spec.dependency 'XCTest'
  end
end