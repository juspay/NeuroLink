#!/bin/bash
set -e

echo "🔄 NeuroLink Video Converter"
echo "============================"

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VIDEOS_DIR="$PROJECT_ROOT/neurolink-demo/videos"

# Function to print colored output
log_info() { echo -e "\033[0;34mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[0;32m✅ $1\033[0m"; }
log_warning() { echo -e "\033[1;33m⚠️  $1\033[0m"; }
log_error() { echo -e "\033[0;31m❌ $1\033[0m"; }

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    if ! command -v ffmpeg &> /dev/null; then
        log_error "ffmpeg is required but not installed"
        echo "Install with: brew install ffmpeg"
        exit 1
    fi
    log_success "Dependencies verified"
}

# Convert WebM to MP4
convert_videos() {
    log_info "Converting WebM videos to MP4..."

    cd "$VIDEOS_DIR"

    for webm_file in *.webm; do
        if [[ -f "$webm_file" ]]; then
            mp4_file="${webm_file%.webm}.mp4"
            log_info "Converting: $webm_file → $mp4_file"

            ffmpeg -i "$webm_file" -c:v libx264 -c:a aac -crf 23 "$mp4_file" -y > /dev/null 2>&1

            if [[ -f "$mp4_file" ]]; then
                log_success "Created: $mp4_file"
            else
                log_error "Failed to create: $mp4_file"
            fi
        fi
    done
}

# Main execution
main() {
    log_info "Starting video conversion process..."
    check_dependencies
    convert_videos
    log_success "Video conversion completed!"

    echo ""
    echo "📂 Videos available in: $VIDEOS_DIR"
    ls -la "$VIDEOS_DIR"/*.{webm,mp4} 2>/dev/null || true
}

main "$@"
