#!/bin/bash

# NeuroLink Video Converter
# Converts WebM videos to MP4 for macOS compatibility

set -e

echo "🔄 NeuroLink Video Converter"
echo "============================"

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_VIDEOS_DIR="neurolink-demo/videos"
CLI_VIDEOS_DIR="docs/visual-content/videos"

# Function to print colored output
log_info() { echo -e "\033[0;34mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[0;32m✅ $1\033[0m"; }
log_error() { echo -e "\033[0;31m❌ $1\033[0m"; }

# Function to check dependencies
check_dependencies() {
    log_info "Checking dependencies..."

    if ! command -v ffmpeg &> /dev/null; then
        log_error "ffmpeg not found. Install with: brew install ffmpeg"
        exit 1
    fi

    if ! command -v ffprobe &> /dev/null; then
        log_error "ffprobe not found. Install with: brew install ffmpeg"
        exit 1
    fi

    log_success "Dependencies verified"
}

# Function to convert a single WebM file to MP4
convert_webm_to_mp4() {
    local input_file="$1"
    local output_file="${input_file%.webm}.mp4"

    if [[ -f "$output_file" ]]; then
        log_info "MP4 already exists: $(basename "$output_file")"
        return 0
    fi

    log_info "Converting: $(basename "$input_file")"

    # Convert with high quality settings optimized for macOS
    ffmpeg -i "$input_file" \
        -c:v libx264 \
        -preset medium \
        -crf 23 \
        -c:a aac \
        -b:a 128k \
        -movflags +faststart \
        "$output_file" \
        -y -v quiet

    if [[ $? -eq 0 ]]; then
        # Get file sizes for comparison
        local webm_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file")
        local mp4_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file")
        local webm_mb=$((webm_size / 1024 / 1024))
        local mp4_mb=$((mp4_size / 1024 / 1024))

        log_success "$(basename "$output_file") (${webm_mb}MB → ${mp4_mb}MB)"
        return 0
    else
        log_error "Failed to convert: $(basename "$input_file")"
        return 1
    fi
}

# Function to process directory
process_directory() {
    local dir="$1"
    local category="$2"

    if [[ ! -d "$dir" ]]; then
        log_info "Directory not found: $dir"
        return 0
    fi

    echo ""
    log_info "Processing $category videos in: $dir"
    echo "$(printf '%.0s-' {1..50})"

    local webm_files=()
    while IFS= read -r -d '' file; do
        webm_files+=("$file")
    done < <(find "$dir" -name "*.webm" -type f -print0)

    if [[ ${#webm_files[@]} -eq 0 ]]; then
        log_info "No WebM files found"
        return 0
    fi

    log_info "Found ${#webm_files[@]} WebM files to convert"

    local converted=0
    local failed=0

    for webm_file in "${webm_files[@]}"; do
        if convert_webm_to_mp4 "$webm_file"; then
            ((converted++))
        else
            ((failed++))
        fi
    done

    log_success "$category: ${converted} converted, ${failed} failed"
}

# Function to create conversion summary
create_summary() {
    log_info "Creating conversion summary..."

    local total_webm=$(find "$PROJECT_ROOT/$WEB_VIDEOS_DIR" "$PROJECT_ROOT/$CLI_VIDEOS_DIR" -name "*.webm" 2>/dev/null | wc -l | tr -d ' ')
    local total_mp4=$(find "$PROJECT_ROOT/$WEB_VIDEOS_DIR" "$PROJECT_ROOT/$CLI_VIDEOS_DIR" -name "*.mp4" 2>/dev/null | wc -l | tr -d ' ')

    echo ""
    echo "📊 Conversion Summary"
    echo "===================="
    echo "WebM files: $total_webm"
    echo "MP4 files:  $total_mp4"
    echo ""
    echo "✅ Both WebM and MP4 versions available for maximum compatibility!"
}

# Main function
main() {
    echo ""
    log_info "Starting video conversion process..."

    check_dependencies

    # Process web demo videos
    process_directory "$PROJECT_ROOT/$WEB_VIDEOS_DIR" "Web Demo"

    # Process CLI demo videos
    process_directory "$PROJECT_ROOT/$CLI_VIDEOS_DIR" "CLI Demo"

    create_summary

    echo ""
    log_success "Video conversion completed!"
    echo ""
    echo "📂 MP4 files available at:"
    echo "   Web demos: $WEB_VIDEOS_DIR/**/*.mp4"
    echo "   CLI demos: $CLI_VIDEOS_DIR/**/*.mp4"
}

# Execute main function
main "$@"
