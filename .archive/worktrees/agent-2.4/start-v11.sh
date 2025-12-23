#!/bin/bash

# Aurigraph V11 Quick Start Script
echo "🚀 Starting Aurigraph V11 (Java/Quarkus) Platform..."

# Set Java environment
export JAVA_HOME=/opt/homebrew/Cellar/openjdk/24.0.2/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH

# Navigate to V11 directory
cd aurigraph-av10-7/aurigraph-v11-standalone/

# Check if running in dev or production mode
if [ "$1" == "dev" ]; then
    echo "📝 Starting in development mode with hot reload..."
    ./mvnw quarkus:dev
elif [ "$1" == "native" ]; then
    echo "⚡ Building and running native executable..."
    ./mvnw package -Pnative-fast
    ./target/aurigraph-v11-standalone-11.0.0-runner
else
    echo "🔧 Starting in standard JVM mode..."
    ./mvnw clean compile quarkus:dev
fi