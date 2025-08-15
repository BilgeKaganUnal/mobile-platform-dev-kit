#!/bin/bash

# Production Environment Docker Script
# Manages the production Docker deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to show usage
usage() {
    echo "Full-Stack Auth Boilerplate - Production Environment"
    echo "================================================"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy    Deploy to production"
    echo "  stop      Stop production environment"
    echo "  restart   Restart production environment"
    echo "  logs      Show logs (specify service)"
    echo "  status    Show status of all services"
    echo "  backup    Create database backup"
    echo "  restore   Restore from database backup"
    echo "  update    Update services (pull latest images)"
    echo "  scale     Scale services (e.g., backend=3)"
    echo ""
    echo "Options:"
    echo "  --with-nginx    Include Nginx reverse proxy"
    echo "  --with-redis    Include Redis service"
    echo "  --build         Force rebuild containers"
    echo "  --no-backup     Skip automatic backup before deploy"
    echo "  --only-rest-api Deploy only REST API service"
    echo "  --only-event-queue Deploy only Event Queue service"
    echo ""
    echo "Examples:"
    echo "  $0 deploy                      # Deploy all services"
    echo "  $0 deploy --with-nginx         # Deploy with Nginx"
    echo "  $0 deploy --only-rest-api      # Deploy only REST API"
    echo "  $0 logs rest-api               # Show REST API logs"
    echo "  $0 logs event-queue            # Show Event Queue logs"
    echo "  $0 backup                      # Create database backup"
    echo "  $0 scale rest-api=2 event-queue=1 # Scale services independently"
    echo ""
}

# Parse command line arguments
parse_args() {
    COMMAND=""
    SERVICE=""
    SCALE_ARGS=""
    WITH_NGINX=false
    WITH_REDIS=false
    FORCE_BUILD=false
    NO_BACKUP=false
    ONLY_REST_API=false
    ONLY_EVENT_QUEUE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            deploy|stop|restart|logs|status|backup|restore|update|scale)
                COMMAND="$1"
                shift
                ;;
            rest-api|event-queue|database|redis|nginx)
                SERVICE="$1"
                shift
                ;;
            *=*)
                SCALE_ARGS="$1"
                shift
                ;;
            --with-nginx)
                WITH_NGINX=true
                shift
                ;;
            --with-redis)
                WITH_REDIS=true
                shift
                ;;
            --build)
                FORCE_BUILD=true
                shift
                ;;
            --no-backup)
                NO_BACKUP=true
                shift
                ;;
            --only-rest-api)
                ONLY_REST_API=true
                shift
                ;;
            --only-event-queue)
                ONLY_EVENT_QUEUE=true
                shift
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                usage
                exit 1
                ;;
        esac
    done
    
    if [ -z "$COMMAND" ]; then
        usage
        exit 1
    fi
}

# Check production requirements
check_production_requirements() {
    print_info "Checking production requirements..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_error "Production .env file is missing!"
        print_info "Create a .env file with production configuration"
        exit 1
    fi
    
    # Check critical environment variables
    source .env
    
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "dev-jwt-secret-change-in-production" ]; then
        print_error "JWT_SECRET is not set or using default value!"
        print_info "Set a strong JWT_SECRET in your .env file"
        exit 1
    fi
    
    if [ -z "$DB_PASSWORD" ] || [ "$DB_PASSWORD" = "postgres" ]; then
        print_error "DB_PASSWORD is not set or using default value!"
        print_info "Set a strong DB_PASSWORD in your .env file"
        exit 1
    fi
    
    print_status "Production requirements check passed"
}

# Build compose command with profiles
build_compose_cmd() {
    local cmd="docker-compose -f docker-compose.prod.yml"
    
    # Handle microservices profiles
    if [ "$ONLY_REST_API" = true ]; then
        cmd="$cmd --profile rest-api"
    elif [ "$ONLY_EVENT_QUEUE" = true ]; then
        cmd="$cmd --profile event-queue"
    else
        cmd="$cmd --profile all"
    fi
    
    if [ "$WITH_NGINX" = true ]; then
        cmd="$cmd --profile with-nginx"
    fi
    
    if [ "$WITH_REDIS" = true ]; then
        cmd="$cmd --profile with-redis"
    fi
    
    echo "$cmd"
}

# Create backup before deployment
create_backup() {
    if [ "$NO_BACKUP" = true ]; then
        print_info "Skipping backup (--no-backup flag used)"
        return
    fi
    
    print_info "Creating pre-deployment backup..."
    
    # Create backups directory
    mkdir -p backups
    
    # Run backup service
    docker-compose -f docker-compose.prod.yml --profile backup run --rm backup
    
    print_status "Backup created successfully"
}

# Deploy to production
deploy_production() {
    check_production_requirements
    
    local compose_cmd=$(build_compose_cmd)
    
    print_info "Deploying to production environment..."
    
    # Create backup if database is running
    if docker ps | grep -q "auth_boilerplate_db_prod"; then
        create_backup
    fi
    
    if [ "$FORCE_BUILD" = true ]; then
        print_info "Force rebuilding containers..."
        $compose_cmd build --no-cache
    fi
    
    # Pull latest images
    $compose_cmd pull
    
    # Deploy with zero-downtime strategy
    $compose_cmd up -d --remove-orphans
    
    # Wait for services to be healthy
    print_info "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    if health_check_silent; then
        print_status "Production deployment successful!"
        show_production_info
    else
        print_error "Deployment health check failed!"
        print_info "Check logs: $0 logs"
        exit 1
    fi
}

# Stop production services
stop_production() {
    local compose_cmd=$(build_compose_cmd)
    
    print_warning "Stopping production environment..."
    read -p "Are you sure you want to stop production services? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $compose_cmd down
        print_status "Production services stopped"
    else
        print_info "Operation cancelled"
    fi
}

# Restart production services
restart_production() {
    local compose_cmd=$(build_compose_cmd)
    
    print_info "Restarting production environment..."
    
    if [ "$FORCE_BUILD" = true ]; then
        create_backup
        $compose_cmd down
        $compose_cmd build --no-cache
        $compose_cmd up -d
    else
        $compose_cmd restart
    fi
    
    print_status "Production services restarted"
}

# Show logs
show_logs() {
    local compose_cmd=$(build_compose_cmd)
    
    if [ -n "$SERVICE" ]; then
        print_info "Showing logs for $SERVICE..."
        $compose_cmd logs -f --tail=100 "$SERVICE"
    else
        print_info "Showing logs for all services..."
        $compose_cmd logs -f --tail=100
    fi
}

# Show status
show_status() {
    local compose_cmd=$(build_compose_cmd)
    
    print_info "Production Service Status:"
    $compose_cmd ps
    
    echo ""
    print_info "Container Health:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep auth_boilerplate_.*_prod || echo "No production containers running"
    
    echo ""
    print_info "Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep auth_boilerplate || echo "No containers running"
}

# Create database backup
create_database_backup() {
    print_info "Creating database backup..."
    
    # Ensure backups directory exists
    mkdir -p backups
    
    # Run backup service
    docker-compose -f docker-compose.prod.yml --profile backup run --rm backup
    
    print_status "Database backup completed"
    
    # List recent backups
    print_info "Recent backups:"
    ls -la backups/backup_*.sql.gz 2>/dev/null | tail -5 || echo "No backups found"
}

# Restore from backup
restore_database() {
    print_warning "This will restore the database from a backup!"
    print_warning "ALL CURRENT DATA WILL BE LOST!"
    
    # List available backups
    echo ""
    print_info "Available backups:"
    ls -la backups/backup_*.sql.gz 2>/dev/null || {
        print_error "No backups found!"
        exit 1
    }
    
    echo ""
    read -p "Enter backup filename: " backup_file
    
    if [ ! -f "backups/$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    read -p "Are you sure you want to restore from $backup_file? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restoring database from $backup_file..."
        
        # Stop services to prevent connections
        docker-compose -f docker-compose.prod.yml stop rest-api event-queue 2>/dev/null || true
        
        # Restore database
        gunzip -c "backups/$backup_file" | docker-compose -f docker-compose.prod.yml exec -T database psql -U postgres -d auth_boilerplate
        
        # Start services
        docker-compose -f docker-compose.prod.yml start rest-api event-queue 2>/dev/null || true
        
        print_status "Database restore completed"
    else
        print_info "Restore cancelled"
    fi
}

# Update services
update_services() {
    local compose_cmd=$(build_compose_cmd)
    
    print_info "Updating production services..."
    
    # Create backup first
    create_backup
    
    # Pull latest images
    $compose_cmd pull
    
    # Restart services with new images
    $compose_cmd up -d --remove-orphans
    
    print_status "Services updated successfully"
}

# Scale services
scale_services() {
    if [ -z "$SCALE_ARGS" ]; then
        print_error "No scale arguments provided!"
        print_info "Example: $0 scale rest-api=2 event-queue=1"
        exit 1
    fi
    
    local compose_cmd=$(build_compose_cmd)
    
    print_info "Scaling services: $SCALE_ARGS"
    $compose_cmd up -d --scale $SCALE_ARGS
    
    print_status "Services scaled successfully"
}

# Silent health check
health_check_silent() {
    # Check REST API if it's running
    if docker ps | grep -q "rest_api.*Up" && curl -sf http://localhost:8080/ > /dev/null 2>&1; then
        return 0
    elif [ "$ONLY_EVENT_QUEUE" = true ]; then
        # If only event queue is deployed, check if it's running
        if docker ps | grep -q "event_queue.*Up"; then
            return 0
        fi
    fi
    
    return 1
}

# Show production info
show_production_info() {
    echo ""
    print_info "Production Services:"
    
    if [ "$ONLY_REST_API" = true ]; then
        echo "  🌐 REST API:   http://localhost:8080"
    elif [ "$ONLY_EVENT_QUEUE" = true ]; then
        echo "  📋 Event Queue: Running in background (no HTTP interface)"
    else
        echo "  🌐 REST API:   http://localhost:8080"
        echo "  📋 Event Queue: Running in background (no HTTP interface)"
    fi
    
    echo "  🗄️  Database:   localhost:5432"
    
    if [ "$WITH_NGINX" = true ]; then
        echo "  🔧 Nginx:      http://localhost"
    fi
    
    if [ "$WITH_REDIS" = true ]; then
        echo "  🔄 Redis:      localhost:6379"
    fi
    
    echo ""
    print_info "Monitoring commands:"
    echo "  $0 logs                # View all logs"
    echo "  $0 logs rest-api       # View REST API logs"
    echo "  $0 logs event-queue    # View Event Queue logs"
    echo "  $0 status              # Check service status"
    echo "  $0 backup              # Create backup"
}

# Main execution
main() {
    # Check if we're in the right directory
    if [ ! -f "docker-compose.prod.yml" ]; then
        print_error "docker-compose.prod.yml not found!"
        print_info "Please run this script from the project root directory"
        exit 1
    fi
    
    parse_args "$@"
    
    case $COMMAND in
        deploy)
            deploy_production
            ;;
        stop)
            stop_production
            ;;
        restart)
            restart_production
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        backup)
            create_database_backup
            ;;
        restore)
            restore_database
            ;;
        update)
            update_services
            ;;
        scale)
            scale_services
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"