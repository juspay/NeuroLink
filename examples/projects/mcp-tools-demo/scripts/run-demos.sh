#!/bin/bash

# =============================================================================
# NeuroLink MCP Tools Demo Runner
# =============================================================================
#
# This script provides a convenient way to run the MCP (Model Context Protocol)
# tool integration demos in the mcp-tools-demo project.
#
# Available demos:
#   - built-in  : Demonstrates NeuroLink's built-in tools
#   - custom    : Shows how to create and register custom tools
#   - external  : Connects to external MCP servers (GitHub, PostgreSQL, etc.)
#   - http      : Uses HTTP/Streamable HTTP transport for remote MCP servers
#   - all       : Runs all demos sequentially
#
# Usage:
#   ./scripts/run-demos.sh [demo-name]
#   ./scripts/run-demos.sh --help
#
# Examples:
#   ./scripts/run-demos.sh built-in
#   ./scripts/run-demos.sh all
#   ./scripts/run-demos.sh --list
#
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Print colored message
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}=============================================${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${CYAN}${BOLD}=============================================${NC}"
    echo ""
}

# Show usage information
show_usage() {
    echo ""
    echo -e "${BOLD}NeuroLink MCP Tools Demo Runner${NC}"
    echo ""
    echo -e "${BOLD}Usage:${NC}"
    echo "  $0 [demo-name]"
    echo "  $0 [option]"
    echo ""
    echo -e "${BOLD}Available demos:${NC}"
    echo "  built-in    Run the built-in tools demo"
    echo "  custom      Run the custom tools demo"
    echo "  external    Run the external MCP server demo"
    echo "  http        Run the HTTP transport demo"
    echo "  all         Run all demos sequentially"
    echo ""
    echo -e "${BOLD}Options:${NC}"
    echo "  --help, -h      Show this help message"
    echo "  --list, -l      List all available demos"
    echo "  --check, -c     Check project setup and dependencies"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo "  $0 built-in         # Run built-in tools demo"
    echo "  $0 custom           # Run custom tools demo"
    echo "  $0 all              # Run all demos"
    echo "  $0 --check          # Verify setup"
    echo ""
}

# List available demos
list_demos() {
    echo ""
    echo -e "${BOLD}Available Demos:${NC}"
    echo ""
    echo -e "  ${CYAN}built-in${NC}   - Built-in tools: getCurrentTime, readFile, writeFile,"
    echo "               listDirectory, calculateMath, websearchGrounding"
    echo ""
    echo -e "  ${CYAN}custom${NC}     - Custom tool creation and registration with schemas"
    echo ""
    echo -e "  ${CYAN}external${NC}   - External MCP servers (GitHub, PostgreSQL, etc.)"
    echo ""
    echo -e "  ${CYAN}http${NC}       - HTTP/Streamable HTTP transport for remote MCP servers"
    echo ""
    echo -e "  ${CYAN}all${NC}        - Run all demos in sequence"
    echo ""
}

# Check project setup
check_setup() {
    print_header "Checking Project Setup"

    local has_errors=false

    # Check if in project directory
    if [[ ! -f "${PROJECT_ROOT}/package.json" ]]; then
        print_error "package.json not found. Are you in the mcp-tools-demo directory?"
        has_errors=true
    else
        print_success "package.json found"
    fi

    # Check for node_modules
    if [[ ! -d "${PROJECT_ROOT}/node_modules" ]]; then
        print_warning "node_modules not found. Run 'npm install' first."
        has_errors=true
    else
        print_success "node_modules directory found"
    fi

    # Check for .env file
    if [[ ! -f "${PROJECT_ROOT}/.env" ]]; then
        if [[ -f "${PROJECT_ROOT}/.env.example" ]]; then
            print_warning ".env file not found. Copy .env.example to .env and configure it."
        else
            print_warning ".env file not found. You may need to create one with API keys."
        fi
    else
        print_success ".env file found"
    fi

    # Check for ts-node
    if ! command -v npx &> /dev/null; then
        print_error "npx not found. Please install Node.js."
        has_errors=true
    else
        print_success "npx available"
    fi

    # Check demo files exist
    local demo_files=("built-in-tools.ts" "custom-tools.ts" "external-mcp.ts" "http-transport.ts")
    for demo_file in "${demo_files[@]}"; do
        if [[ -f "${PROJECT_ROOT}/src/demo/${demo_file}" ]]; then
            print_success "Demo file found: src/demo/${demo_file}"
        else
            print_error "Demo file missing: src/demo/${demo_file}"
            has_errors=true
        fi
    done

    echo ""
    if [[ "$has_errors" == true ]]; then
        print_error "Some checks failed. Please resolve the issues above."
        return 1
    else
        print_success "All checks passed! Ready to run demos."
        return 0
    fi
}

# Run a specific demo
run_demo() {
    local demo_name="$1"
    local script_name=""

    case "$demo_name" in
        built-in|builtin)
            script_name="demo:built-in"
            print_header "Running Built-in Tools Demo"
            ;;
        custom)
            script_name="demo:custom"
            print_header "Running Custom Tools Demo"
            ;;
        external)
            script_name="demo:external"
            print_header "Running External MCP Server Demo"
            ;;
        http)
            script_name="demo:http"
            print_header "Running HTTP Transport Demo"
            ;;
        all)
            print_header "Running All Demos"
            cd "${PROJECT_ROOT}"
            npm run start
            print_success "All demos completed!"
            return 0
            ;;
        *)
            print_error "Unknown demo: ${demo_name}"
            echo ""
            echo "Run '$0 --list' to see available demos."
            return 1
            ;;
    esac

    cd "${PROJECT_ROOT}"

    print_info "Executing: npm run ${script_name}"
    echo ""

    npm run "${script_name}"

    echo ""
    print_success "Demo '${demo_name}' completed!"
}

# Main script logic
main() {
    # No arguments - show usage
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 0
    fi

    case "$1" in
        --help|-h)
            show_usage
            exit 0
            ;;
        --list|-l)
            list_demos
            exit 0
            ;;
        --check|-c)
            check_setup
            exit $?
            ;;
        *)
            run_demo "$1"
            exit $?
            ;;
    esac
}

# Run main function
main "$@"
