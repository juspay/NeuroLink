#!/bin/bash
set -e

echo "🎬 NeuroLink Complete Video Generation Pipeline"
echo "=============================================="

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_DIR="$PROJECT_ROOT/neurolink-demo"

# Function to print colored output
log_info() { echo -e "\033[0;34mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[0;32m✅ $1\033[0m"; }
log_warning() { echo -e "\033[1;33m⚠️  $1\033[0m"; }
log_error() { echo -e "\033[0;31m❌ $1\033[0m"; }

# Check if demo server is running
check_server() {
    log_info "Checking if demo server is running..."
    if curl -s http://localhost:9876 > /dev/null 2>&1; then
        log_success "Demo server is running"
        return 0
    else
        log_error "Demo server is not running"
        echo "Please start the demo server first:"
        echo "  cd neurolink-demo && node server.js"
        return 1
    fi
}

# Generate comprehensive demo videos
generate_videos() {
    log_info "Generating comprehensive demo videos..."
    cd "$DEMO_DIR"
    node create-comprehensive-demo-videos.js
    log_success "Video generation completed"
}

# Convert videos to MP4
convert_videos() {
    log_info "Converting videos to MP4 format..."
    cd "$PROJECT_ROOT"
    ./scripts/convert-demo-videos.sh
    log_success "Video conversion completed"
}

# Show results
show_results() {
    log_info "Video generation summary:"
    echo ""
    echo "📁 Generated videos in: $DEMO_DIR/videos/"
    echo ""
    echo "🎥 Use Case Videos Created:"
    echo "  • basic-examples.webm/.mp4     - Core SDK functionality"
    echo "  • business-use-cases.webm/.mp4 - Professional applications"
    echo "  • creative-tools.webm/.mp4     - Content creation"
    echo "  • developer-tools.webm/.mp4   - Technical applications"
    echo "  • monitoring-analytics.webm/.mp4 - SDK performance features"
    echo ""
    echo "📋 These videos demonstrate:"
    echo "  ✓ Real AI generation with actual API calls"
    echo "  ✓ Business value and practical use cases"
    echo "  ✓ SDK capabilities and features"
    echo "  ✓ Professional applications developers can implement"
    echo ""
    echo "🔗 Videos are now referenced in README.md"
}

# Main execution
main() {
    log_info "Starting complete video generation pipeline..."

    if check_server; then
        generate_videos
        convert_videos
        show_results
        log_success "Complete video generation pipeline finished!"
    else
        exit 1
    fi
}

main "$@"
