# List available commands
default:
    just --list

# ====================================
# === Local Development Setup ===
# ====================================

setup_local_dev:
    # Check Node.js version
    @echo "Checking Node.js version..."
    @node --version || echo "⚠️  Node.js not found. Please install Node.js 18 or later"

    # Install dependencies
    @echo "Installing npm dependencies..."
    npm install

    @echo ""
    @echo "✅ Local development setup complete!"
    @echo ""
    @echo "📝 Next steps:"
    @echo "  1. Run 'just run_tests' to verify everything works"
    @echo "  2. Run 'just build' to build the action"

# ====================================
# === Testing ===
# ====================================

# Run all tests
run_tests:
    @echo "Running tests..."
    npm test

# Run tests in watch mode
test_watch:
    @echo "Running tests in watch mode..."
    npm test -- --watch

# Run tests with coverage
test_coverage:
    @echo "Running tests with coverage..."
    npm test -- --coverage

# ====================================
# === Code Quality ===
# ====================================

# Lint code
lint:
    @echo "Running ESLint..."
    npm run lint

# Format code
format:
    @echo "Formatting code with Prettier..."
    npm run format

# Run all checks (lint + test + build)
check:
    @echo "Running all checks..."
    npm run all

# ====================================
# === Build ===
# ====================================

# Build the action
build:
    @echo "Building GitHub Action..."
    npm run build

# Clean build artifacts
clean:
    @echo "Cleaning build artifacts..."
    rm -rf dist
    @echo "✅ Clean complete"

# Clean everything including node_modules
clean_all:
    @echo "Cleaning everything..."
    rm -rf dist
    rm -rf node_modules
    @echo "✅ Deep clean complete. Run 'npm install' to reinstall dependencies"

# ====================================
# === Dependencies ===
# ====================================

# Update dependencies
update_deps:
    @echo "Updating dependencies..."
    npm update
    @echo "✅ Dependencies updated"

# Install a new dependency
add_dep package:
    @echo "Installing {{package}}..."
    npm install {{package}}

# Install a new dev dependency
add_dev_dep package:
    @echo "Installing {{package}} as dev dependency..."
    npm install --save-dev {{package}}

# ====================================
# === Git Helpers ===
# ====================================

# Run full CI pipeline locally (format, lint, build, test)
ci:
    @echo "Running full CI pipeline..."
    just format
    just lint
    just build
    just run_tests
    @echo ""
    @echo "✅ CI pipeline complete!"
    @echo "📝 Ready to commit and push"
