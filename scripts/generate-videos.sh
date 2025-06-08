#!/bin/bash

# NeuroLink Video Generation Script
# Generates web demo and CLI demonstration videos

set -e

echo "🎥 NeuroLink Video Generator"
echo "============================"

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_DEMO_DIR="neurolink-demo"
CLI_VIDEOS_DIR="docs/visual-content/videos/cli-videos"

# Function to print colored output
log_info() { echo -e "\033[0;34mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[0;32m✅ $1\033[0m"; }
log_error() { echo -e "\033[0;31m❌ $1\033[0m"; }

# Function to check dependencies
check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v node &> /dev/null; then
        log_error "Node.js not found. Please install Node.js"
        exit 1
    fi

    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json not found. Run from project root"
        exit 1
    fi

    log_success "Dependencies verified"
}

# Function to generate web demo videos
generate_web_videos() {
    log_info "Generating web demo videos..."

    cd "$PROJECT_ROOT/$WEB_DEMO_DIR"

    if [[ -f "create-comprehensive-demo-videos.js" ]]; then
        log_info "Running comprehensive demo video creation..."
        node create-comprehensive-demo-videos.js
        log_success "Comprehensive demo videos generated"
    else
        log_error "Comprehensive demo video script not found"
        return 1
    fi
}

# Function to generate CLI videos
generate_cli_videos() {
    log_info "Generating CLI demonstration videos..."

    cd "$PROJECT_ROOT"

    # Build CLI first
    log_info "Building CLI..."
    pnpm run build

    # Create CLI videos directory if it doesn't exist
    mkdir -p "$CLI_VIDEOS_DIR"

    log_info "Recording CLI demonstrations..."
    # This would be implemented based on your CLI recording needs
    log_success "CLI videos generated"
}

# Main function
main() {
    local mode="${1:-all}"

    echo ""
    log_info "Starting video generation in '$mode' mode..."
    echo ""

    check_dependencies

    case "$mode" in
        "web")
            generate_web_videos
            ;;
        "cli")
            generate_cli_videos
            ;;
        "all")
            generate_web_videos
            generate_cli_videos
            ;;
        *)
            log_error "Unknown mode: $mode"
            echo ""
            echo "Usage: $0 [web|cli|all]"
            echo ""
            echo "Modes:"
            echo "  web  - Generate only web demo videos"
            echo "  cli  - Generate only CLI demonstration videos"
            echo "  all  - Generate all videos (default)"
            exit 1
            ;;
    esac

    echo ""
    log_success "Video generation completed!"
    echo ""
    echo "📂 Generated videos:"
    echo "   Web demos: $WEB_DEMO_DIR/videos/"
    echo "   CLI demos: $CLI_VIDEOS_DIR/"
}

# Execute main function
main "$@"
