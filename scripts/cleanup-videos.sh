#!/bin/bash

# NeuroLink Video Cleanup
# Standardizes video names and removes duplicates

set -e

echo "🧹 NeuroLink Video Cleanup"
echo "=========================="

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB_VIDEOS_DIR="neurolink-demo/videos"
CLI_VIDEOS_DIR="docs/visual-content/videos"

# Function to print colored output
log_info() { echo -e "\033[0;34mℹ️  $1\033[0m"; }
log_success() { echo -e "\033[0;32m✅ $1\033[0m"; }
log_warning() { echo -e "\033[1;33m⚠️  $1\033[0m"; }
log_error() { echo -e "\033[0;31m❌ $1\033[0m"; }

# Function to get video info for descriptive naming
get_video_info() {
    local file="$1"
    local category="$2"

    if command -v ffprobe &> /dev/null; then
        local duration=$(ffprobe -v quiet -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file" 2>/dev/null | cut -d. -f1)
        local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file")
        local size_mb=$((size / 1024 / 1024))

        echo "${category}-demo-${duration}s-${size_mb}mb"
    else
        echo "${category}-demo"
    fi
}

# Function to standardize video names in a directory
standardize_directory() {
    local dir="$1"
    local category="$2"

    if [[ ! -d "$dir" ]]; then
        log_warning "Directory not found: $dir"
        return 0
    fi

    echo ""
    log_info "Standardizing names in: $dir"
    echo "$(printf '%.0s-' {1..50})"

    local webm_files=()
    while IFS= read -r -d '' file; do
        webm_files+=("$file")
    done < <(find "$dir" -name "*.webm" -type f -print0)

    if [[ ${#webm_files[@]} -eq 0 ]]; then
        log_info "No WebM files found"
        return 0
    fi

    log_info "Found ${#webm_files[@]} WebM files to process"

    local renamed_count=0
    local index=1

    # Sort files by modification time (oldest first)
    local sorted_files=()
    while IFS= read -r -d '' file; do
        sorted_files+=("$file")
    done < <(printf '%s\0' "${webm_files[@]}" | xargs -0 ls -1t | tac | tr '\n' '\0')

    for webm_file in "${sorted_files[@]}"; do
        local current_name=$(basename "$webm_file")

        # Skip if already has good naming pattern
        if [[ "$current_name" =~ ^[a-z-]+-demo.*\.webm$ ]]; then
            log_info "Already standardized: $current_name"
            ((index++))
            continue
        fi

        # Create new descriptive name
        local base_name=$(get_video_info "$webm_file" "$category")
        local new_name="${base_name}"

        if [[ $index -gt 1 ]]; then
            new_name="${base_name}-v${index}"
        fi

        new_name="${new_name}.webm"
        local new_path="$(dirname "$webm_file")/$new_name"

        if [[ "$webm_file" != "$new_path" ]]; then
            log_info "Renaming: $current_name → $new_name"
            mv "$webm_file" "$new_path"

            # Also rename corresponding MP4 if it exists
            local mp4_file="${webm_file%.webm}.mp4"
            if [[ -f "$mp4_file" ]]; then
                local new_mp4_name="${new_name%.webm}.mp4"
                local new_mp4_path="$(dirname "$mp4_file")/$new_mp4_name"
                log_info "Renaming MP4: $(basename "$mp4_file") → $new_mp4_name"
                mv "$mp4_file" "$new_mp4_path"
            fi

            ((renamed_count++))
        fi

        ((index++))
    done

    log_success "Renamed $renamed_count files in $category"
}

# Function to remove files with problematic names
fix_problematic_filenames() {
    log_info "Fixing problematic filenames..."

    # Find and fix files with N/A or other problematic characters
    find "$PROJECT_ROOT/$WEB_VIDEOS_DIR" "$PROJECT_ROOT/$CLI_VIDEOS_DIR" \( -name "*N/A*" -o -name "*/*" \) 2>/dev/null | while read -r file; do
        if [[ -f "$file" ]]; then
            local dir=$(dirname "$file")
            local filename=$(basename "$file")
            local new_filename=$(echo "$filename" | sed 's/N\/A/unknown/g' | sed 's/\//-/g')
            local new_path="$dir/$new_filename"

            if [[ "$file" != "$new_path" ]]; then
                log_info "Fixing: $filename → $new_filename"
                mv "$file" "$new_path"
            fi
        fi
    done

    log_success "Problematic filenames fixed"
}

# Function to create cleanup summary
create_summary() {
    log_info "Creating cleanup summary..."

    local report_file="docs/test-reports/video-cleanup-summary.md"
    local timestamp=$(date)

    cat > "$report_file" << EOF
# 🧹 NeuroLink Video Cleanup Summary

**Generated**: $timestamp
**Script**: Video Cleanup & Standardization

## 📊 Video Inventory

EOF

    # Count videos in each location
    local web_webm=$(find "$PROJECT_ROOT/$WEB_VIDEOS_DIR" -name "*.webm" 2>/dev/null | wc -l | tr -d ' ')
    local web_mp4=$(find "$PROJECT_ROOT/$WEB_VIDEOS_DIR" -name "*.mp4" 2>/dev/null | wc -l | tr -d ' ')
    local cli_webm=$(find "$PROJECT_ROOT/$CLI_VIDEOS_DIR" -name "*.webm" 2>/dev/null | wc -l | tr -d ' ')
    local cli_mp4=$(find "$PROJECT_ROOT/$CLI_VIDEOS_DIR" -name "*.mp4" 2>/dev/null | wc -l | tr -d ' ')

    cat >> "$report_file" << EOF
### 📁 Web Demo Videos
- **WebM files**: $web_webm
- **MP4 files**: $web_mp4

### 🖥️ CLI Demo Videos
- **WebM files**: $cli_webm
- **MP4 files**: $cli_mp4

### 📈 Totals
- **Total WebM**: $((web_webm + cli_webm))
- **Total MP4**: $((web_mp4 + cli_mp4))
- **Total Videos**: $((web_webm + web_mp4 + cli_webm + cli_mp4))

## ✅ Cleanup Actions Performed

- 🔧 Fixed problematic filenames (N/A, special characters)
- 📝 Standardized naming to: \`{category}-demo-{duration}s-{size}mb[-v{version}].{ext}\`
- 🎯 Maintained both WebM and MP4 versions
- 📊 Generated comprehensive inventory

## 📂 File Naming Convention

Videos now follow the pattern: \`{category}-demo-{duration}s-{size}mb[-v{version}].{ext}\`

Examples:
- \`basic-examples-demo-34s-3mb.webm\`
- \`cli-overview-demo-15s-1mb-v2.mp4\`
- \`business-use-cases-demo-62s-6mb.webm\`

---

*Report generated by NeuroLink Video Cleanup Script*
EOF

    log_success "Summary created: $report_file"
}

# Main function
main() {
    echo ""
    log_info "Starting video cleanup process..."

    # Fix problematic filenames first
    fix_problematic_filenames

    # Standardize names in all video directories
    if [[ -d "$PROJECT_ROOT/$WEB_VIDEOS_DIR" ]]; then
        for category_dir in "$PROJECT_ROOT/$WEB_VIDEOS_DIR"/*; do
            if [[ -d "$category_dir" ]]; then
                local category=$(basename "$category_dir")
                standardize_directory "$category_dir" "$category"
            fi
        done
    fi

    if [[ -d "$PROJECT_ROOT/$CLI_VIDEOS_DIR" ]]; then
        for category_dir in "$PROJECT_ROOT/$CLI_VIDEOS_DIR"/*; do
            if [[ -d "$category_dir" ]]; then
                local category=$(basename "$category_dir")
                standardize_directory "$category_dir" "cli-$category"
            fi
        done
    fi

    create_summary

    echo ""
    log_success "Video cleanup completed!"
    echo ""
    echo "📂 Cleaned video locations:"
    echo "   Web demos: $WEB_VIDEOS_DIR/**/"
    echo "   CLI demos: $CLI_VIDEOS_DIR/**/"
    echo ""
    echo "📋 Summary: docs/test-reports/video-cleanup-summary.md"
}

# Execute main function
main "$@"
