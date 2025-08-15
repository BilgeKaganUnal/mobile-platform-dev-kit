#!/bin/bash

# Full-Stack Auth Boilerplate Setup Script
# This script sets up the development environment

set -e  # Exit on any error

echo "🚀 Setting up Full-Stack Auth Boilerplate..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# =============================================================================
# Configuration Functions
# =============================================================================

# Generate secure random password
generate_password() {
    local length=${1:-16}
    # Use openssl for secure random password generation
    if command -v openssl &> /dev/null; then
        openssl rand -base64 32 | tr -d "=+/" | cut -c1-${length}
    else
        # Fallback to /dev/urandom if openssl is not available
        LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c${length}
    fi
}

# Generate JWT secret (longer and more secure)
generate_jwt_secret() {
    if command -v openssl &> /dev/null; then
        openssl rand -hex 32
    else
        LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c64
    fi
}

# Prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local secure="$3"  # If set to "secure", hide input
    local user_input
    
    if [ "$secure" = "secure" ]; then
        printf "${BLUE}${prompt}${NC} [${YELLOW}${default}${NC}]: "
        read -s user_input
        echo  # Add newline since -s doesn't echo one
    else
        printf "${BLUE}${prompt}${NC} [${YELLOW}${default}${NC}]: "
        read user_input
    fi
    
    # Return default if input is empty
    echo "${user_input:-$default}"
}

# Validate password strength (basic check)
validate_password() {
    local password="$1"
    local min_length=8
    
    if [ ${#password} -lt ${min_length} ]; then
        print_warning "Password should be at least ${min_length} characters long"
        return 1
    fi
    
    return 0
}

# Display configuration summary
display_config_summary() {
    echo ""
    echo "📋 Configuration Summary:"
    echo "=========================="
    echo "Database User:     $DB_CONFIG_USER"
    echo "Database Name:     $DB_CONFIG_NAME"
    echo "Redis Password:    $REDIS_CONFIG_PASSWORD"
    echo "JWT Secret:        [Hidden - 64 characters]"
    echo ""
}

# Collect all configuration from user
collect_configuration() {
    print_info "Let's configure your credentials securely..."
    echo ""
    
    # Generate secure defaults
    local default_db_password=$(generate_password 12)
    local default_redis_password=$(generate_password 16)
    local default_jwt_secret=$(generate_jwt_secret)
    
    # Database configuration
    echo "🗄️  Database Configuration:"
    DB_CONFIG_USER=$(prompt_with_default "Database username" "postgres")
    DB_CONFIG_PASSWORD=$(prompt_with_default "Database password" "$default_db_password" "secure")
    DB_CONFIG_NAME=$(prompt_with_default "Database name" "auth_boilerplate")
    
    # Validate database password
    while ! validate_password "$DB_CONFIG_PASSWORD"; do
        DB_CONFIG_PASSWORD=$(prompt_with_default "Please enter a stronger database password" "$default_db_password" "secure")
    done
    
    echo ""
    echo "🔄 Redis Configuration:"
    REDIS_CONFIG_PASSWORD=$(prompt_with_default "Redis password" "$default_redis_password" "secure")
    
    # Validate Redis password
    while ! validate_password "$REDIS_CONFIG_PASSWORD"; do
        REDIS_CONFIG_PASSWORD=$(prompt_with_default "Please enter a stronger Redis password" "$default_redis_password" "secure")
    done
    
    echo ""
    echo "🔐 Security Configuration:"
    JWT_CONFIG_SECRET=$(prompt_with_default "JWT secret (leave empty for secure auto-generated)" "$default_jwt_secret")
    
    # Global variables for use in other functions
    export DB_CONFIG_USER DB_CONFIG_PASSWORD DB_CONFIG_NAME REDIS_CONFIG_PASSWORD JWT_CONFIG_SECRET
    
    display_config_summary
    
    # Confirm configuration
    echo ""
    read -p "Proceed with this configuration? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Configuration cancelled. Re-run the script to try again."
        exit 0
    fi
}

# Check if existing configuration is present
has_existing_configuration() {
    # Check if both env files exist
    if [ ! -f "backend/.env" ] || [ ! -f ".env" ]; then
        return 1
    fi
    
    # Check if backend/.env contains configured DATABASE_URL (not placeholder)
    if grep -q "postgresql://username:password@" backend/.env 2>/dev/null; then
        return 1
    fi
    
    # Check if root .env contains configured credentials (not empty values)
    if ! grep -q "DB_USER=" .env 2>/dev/null || ! grep -q "DB_PASSWORD=" .env 2>/dev/null; then
        return 1
    fi
    
    # Configuration appears to be present
    return 0
}

# Load existing credentials from .env files
load_existing_credentials() {
    if [ ! -f ".env" ]; then
        print_error "Root .env file not found. Cannot load existing configuration."
        return 1
    fi
    
    # Source the root .env file to get variables
    set -a  # Export all variables
    source .env 2>/dev/null || {
        print_error "Failed to load existing configuration from .env file."
        return 1
    }
    set +a  # Stop auto-exporting
    
    # Map to our expected variable names
    DB_CONFIG_USER="${DB_USER:-postgres}"
    DB_CONFIG_PASSWORD="${DB_PASSWORD}"
    DB_CONFIG_NAME="${DB_NAME:-auth_boilerplate}"
    REDIS_CONFIG_PASSWORD="${REDIS_PASSWORD}"
    JWT_CONFIG_SECRET="${JWT_SECRET}"
    
    # Export for use in other functions
    export DB_CONFIG_USER DB_CONFIG_PASSWORD DB_CONFIG_NAME REDIS_CONFIG_PASSWORD JWT_CONFIG_SECRET
    
    return 0
}

# Display existing configuration summary
display_existing_config_summary() {
    echo ""
    echo "📋 Existing Configuration Found:"
    echo "================================="
    echo "Database User:     $DB_CONFIG_USER"
    echo "Database Name:     $DB_CONFIG_NAME"
    echo "Database Password: [Hidden - ${#DB_CONFIG_PASSWORD} characters]"
    echo "Redis Password:    [Hidden - ${#REDIS_CONFIG_PASSWORD} characters]"
    echo "JWT Secret:        [Hidden - ${#JWT_CONFIG_SECRET} characters]"
    echo ""
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        print_info "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        print_info "Visit: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    print_status "Docker and Docker Compose are installed"
}

# Check if Bun is installed (for backend and mobile development)
check_bun() {
    if ! command -v bun &> /dev/null; then
        print_warning "Bun is not installed. Required for backend and mobile development."
        print_info "Visit: https://bun.sh/"
    else
        BUN_VERSION=$(bun --version)
        print_status "Bun is installed: v$BUN_VERSION"
    fi
}

# Create environment files from configuration
setup_env_files() {
    # Check if we should skip file creation (when using existing config)
    if has_existing_configuration && [ -f "backend/.env" ] && [ -f ".env" ]; then
        # Check if user chose to skip (option 1) by seeing if files weren't modified recently
        local skip_file_creation=false
        
        # If both env files exist and contain non-placeholder values, ask before overwriting
        if grep -q "postgresql://${DB_CONFIG_USER}:${DB_CONFIG_PASSWORD}@" backend/.env 2>/dev/null; then
            skip_file_creation=true
        fi
        
        if [ "$skip_file_creation" = true ]; then
            print_status "Using existing environment files (credentials match current configuration)"
            return 0
        fi
    fi
    
    print_info "Setting up environment files with your configuration..."
    
    # Build DATABASE_URL using configured values
    local database_url="postgresql://${DB_CONFIG_USER}:${DB_CONFIG_PASSWORD}@localhost:5432/${DB_CONFIG_NAME}?schema=public"
    
    # Backend environment file - create/overwrite with new config
    print_info "Creating backend/.env with configured values..."
    cat > backend/.env << EOF
# Environment Configuration
NODE_ENV=development
LOG_LEVEL=debug

# Server Configuration  
API_HOST=0.0.0.0
API_PORT=8080

# Database Configuration
DATABASE_URL="${database_url}"

# JWT Configuration
JWT_SECRET=${JWT_CONFIG_SECRET}

# Redis Configuration for BullMQ
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_CONFIG_PASSWORD}

# CORS Configuration (production only)
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
EOF
    print_status "Created backend/.env with configured values"
    
    # Root environment file for Docker - always overwrite with new config
    print_info "Creating root .env with configured values..."
    cat > .env << EOF
# Database Configuration
DB_USER=${DB_CONFIG_USER}
DB_PASSWORD=${DB_CONFIG_PASSWORD}
DB_NAME=${DB_CONFIG_NAME}

# JWT Configuration
JWT_SECRET=${JWT_CONFIG_SECRET}

# Redis Configuration
REDIS_PASSWORD=${REDIS_CONFIG_PASSWORD}

# Logging
LOG_LEVEL=debug
EOF
    print_status "Created root .env file with configured values"
}

# Install backend dependencies
install_backend_deps() {
    if [ -d "backend" ]; then
        print_info "Installing backend dependencies..."
        cd backend
        
        if [ -f "package.json" ]; then
            bun install
            print_status "Backend dependencies installed"
        else
            print_warning "No package.json found in backend directory"
        fi
        
        cd ..
    else
        print_warning "Backend directory not found"
    fi
}

# Install mobile dependencies
install_mobile_deps() {
    if [ -d "mobile" ]; then
        print_info "Installing mobile dependencies..."
        cd mobile
        
        if [ -f "package.json" ]; then
            bun install
            print_status "Mobile dependencies installed"
        else
            print_warning "No package.json found in mobile directory"
        fi
        
        cd ..
    else
        print_warning "Mobile directory not found"
    fi
}

# Setup database and Redis
setup_database() {
    print_info "Setting up database and Redis with Docker..."
    
    # Start database and Redis services
    docker-compose up -d database redis
    
    print_info "Waiting for services to be ready..."
    sleep 15
    
    # Run database migrations
    if [ -d "backend" ] && [ -f "backend/package.json" ]; then
        print_info "Running database migrations..."
        cd backend
        
        # Generate Prisma client
        bun prisma generate
        
        # Push schema to database
        bun prisma db push
        
        print_status "Database and Redis setup complete"
        cd ..
    else
        print_warning "Cannot run migrations - backend not found or invalid"
    fi
}

# Make scripts executable
make_scripts_executable() {
    print_info "Making scripts executable..."
    chmod +x scripts/*.sh 2>/dev/null || true
    print_status "Scripts are now executable"
}

# Print next steps
print_next_steps() {
    echo ""
    echo "🎉 Setup complete! Next steps:"
    echo "================================================"
    echo ""
    echo "📦 Start the development environment:"
    echo "   ./scripts/docker-dev.sh"
    echo ""
    echo "🌐 Access your services:"
    echo "   Backend API: http://localhost:8080"
    echo "   Database:   localhost:5432"
    echo "   Redis:      localhost:6379"
    echo ""
    echo "📱 For mobile development:"
    echo "   cd mobile && bun start"
    echo ""
    echo "🐳 Docker commands:"
    echo "   docker-compose logs -f backend  # View backend logs"
    echo "   docker-compose down            # Stop all services"
    echo ""
    echo "📚 Documentation:"
    echo "   - Main README.md for overview"
    echo "   - backend/README.md for backend setup"
    echo "   - mobile/README.md for mobile setup"
    echo ""
}

# Main execution
main() {
    echo "Starting setup process..."
    echo ""
    
    check_docker
    check_bun
    
    # Check for existing configuration
    if has_existing_configuration; then
        # Load existing credentials
        if load_existing_credentials; then
            display_existing_config_summary
            
            # Offer skip option
            echo "🔧 Configuration Options:"
            echo "1. Skip - Use existing configuration"
            echo "2. Reconfigure - Set up new credentials (will overwrite existing)"
            echo "3. Auto-generate - Generate new secure defaults (will overwrite existing)"
            echo ""
            read -p "Choose option (1/2/3): " -n 1 -r
            echo
            
            case $REPLY in
                1)
                    print_status "Using existing configuration"
                    ;;
                2)
                    print_info "Reconfiguring credentials..."
                    collect_configuration
                    ;;
                3)
                    print_info "Generating new secure auto-generated credentials..."
                    # Generate secure defaults without prompts
                    DB_CONFIG_USER="postgres"
                    DB_CONFIG_PASSWORD=$(generate_password 12)
                    DB_CONFIG_NAME="auth_boilerplate"
                    REDIS_CONFIG_PASSWORD=$(generate_password 16)
                    JWT_CONFIG_SECRET=$(generate_jwt_secret)
                    export DB_CONFIG_USER DB_CONFIG_PASSWORD DB_CONFIG_NAME REDIS_CONFIG_PASSWORD JWT_CONFIG_SECRET
                    
                    echo "Generated new secure credentials:"
                    echo "- Database: ${DB_CONFIG_USER} / [hidden]"
                    echo "- Redis: [hidden password]"
                    echo "- JWT: [hidden secret]"
                    ;;
                *)
                    print_info "Invalid option. Using existing configuration."
                    ;;
            esac
        else
            print_warning "Failed to load existing configuration. Will create new configuration."
            collect_configuration
        fi
    else
        # No existing configuration - ask for initial setup
        print_info "No existing configuration found. Let's set up credentials."
        echo ""
        read -p "Configure custom credentials? (y/n - 'n' uses secure defaults): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            collect_configuration
        else
            print_info "Using secure auto-generated credentials..."
            # Generate secure defaults without prompts
            DB_CONFIG_USER="postgres"
            DB_CONFIG_PASSWORD=$(generate_password 12)
            DB_CONFIG_NAME="auth_boilerplate"
            REDIS_CONFIG_PASSWORD=$(generate_password 16)
            JWT_CONFIG_SECRET=$(generate_jwt_secret)
            export DB_CONFIG_USER DB_CONFIG_PASSWORD DB_CONFIG_NAME REDIS_CONFIG_PASSWORD JWT_CONFIG_SECRET
            
            echo "Generated secure credentials:"
            echo "- Database: ${DB_CONFIG_USER} / [hidden]"
            echo "- Redis: [hidden password]"
            echo "- JWT: [hidden secret]"
        fi
    fi
    
    setup_env_files
    make_scripts_executable
    
    # Ask if user wants to install dependencies
    read -p "Install dependencies? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_backend_deps
        install_mobile_deps
    fi
    
    # Ask if user wants to setup database and Redis
    read -p "Setup database and Redis with Docker? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_database
    fi
    
    print_next_steps
}

# Run main function
main "$@"