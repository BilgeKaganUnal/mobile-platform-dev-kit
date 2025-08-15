#!/bin/bash

# Development Environment Docker Script
# Manages the development Docker environment

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
    echo "Full-Stack Auth Boilerplate - Development Environment"
    echo "================================================"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start     Start the development environment"
    echo "  stop      Stop the development environment"
    echo "  restart   Restart the development environment"
    echo "  logs      Show logs (specify service: rest-api, event-queue, database, redis)"
    echo "  status    Show status of all services"
    echo "  clean     Clean up containers and volumes"
    echo "  shell     Access microservice container shell"
    echo "  db        Access database shell"
    echo "  health    Perform health check on all services"
    echo ""
    echo "Options:"
    echo "  --with-pgadmin   Include PgAdmin service"
    echo "  --build          Force rebuild containers"
    echo "  --only-rest-api  Start only REST API service"
    echo "  --only-event-queue  Start only Event Queue service"
    echo ""
    echo "Examples:"
    echo "  $0 start                     # Start all services (includes Redis)"
    echo "  $0 start --with-pgadmin      # Start with PgAdmin"
    echo "  $0 start --only-rest-api     # Start only REST API"
    echo "  $0 logs rest-api             # Show REST API logs"
    echo "  $0 logs event-queue          # Show Event Queue logs"
    echo "  $0 logs redis                # Show Redis logs"
    echo "  $0 restart --build           # Restart with rebuild"
    echo ""
}

# Parse command line arguments
parse_args() {
    COMMAND=""
    SERVICE=""
    WITH_PGADMIN=false
    FORCE_BUILD=false
    ONLY_REST_API=false
    ONLY_EVENT_QUEUE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            start|stop|restart|logs|status|clean|shell|db|health)
                COMMAND="$1"
                shift
                ;;
            rest-api|event-queue|database|redis)
                SERVICE="$1"
                shift
                ;;
            --with-pgadmin)
                WITH_PGADMIN=true
                shift
                ;;
            --build)
                FORCE_BUILD=true
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

# Build compose command with profiles
build_compose_cmd() {
    local cmd="docker-compose"
    
    # Handle microservices profiles
    if [ "$ONLY_REST_API" = true ]; then
        cmd="$cmd --profile rest-api"
    elif [ "$ONLY_EVENT_QUEUE" = true ]; then
        cmd="$cmd --profile event-queue"
    else
        cmd="$cmd --profile all"
    fi
    
    
    if [ "$WITH_PGADMIN" = true ]; then
        cmd="$cmd --profile with-pgadmin"
    fi
    
    echo "$cmd"
}

# Start services
start_services() {
    local compose_cmd=$(build_compose_cmd)
    
    print_info "Starting development environment..."
    
    if [ "$FORCE_BUILD" = true ]; then
        print_info "Force rebuilding containers..."
        $compose_cmd build --no-cache
    fi
    
    # Start services
    $compose_cmd up -d
    
    print_status "Services started successfully!"
    
    # Show service URLs
    echo ""
    print_info "Service URLs:"
    
    if [ "$ONLY_REST_API" = true ]; then
        echo "  🌐 REST API:   http://localhost:8080"
    elif [ "$ONLY_EVENT_QUEUE" = true ]; then
        echo "  📋 Event Queue: Running in background (no HTTP interface)"
    else
        echo "  🌐 REST API:   http://localhost:8080"
        echo "  📋 Event Queue: Running in background (no HTTP interface)"
    fi
    
    echo "  🗄️  Database:   localhost:5432"
    echo "  🔄 Redis:      localhost:6379"
    
    if [ "$WITH_PGADMIN" = true ]; then
        echo "  🔧 PgAdmin:    http://localhost:8081"
        echo "     Login: admin@example.com / admin"
    fi
    
    echo ""
    print_info "Use './scripts/docker-dev.sh logs' to view logs"
    print_info "Use './scripts/docker-dev.sh status' to check service status"
}

# Stop services
stop_services() {
    local compose_cmd=$(build_compose_cmd)
    
    print_info "Stopping development environment..."
    $compose_cmd down
    print_status "Services stopped successfully!"
}

# Restart services
restart_services() {
    local compose_cmd=$(build_compose_cmd)
    
    print_info "Restarting development environment..."
    
    if [ "$FORCE_BUILD" = true ]; then
        print_info "Force rebuilding containers..."
        $compose_cmd down
        $compose_cmd build --no-cache
        $compose_cmd up -d
    else
        $compose_cmd restart
    fi
    
    print_status "Services restarted successfully!"
}

# Show logs
show_logs() {
    local compose_cmd=$(build_compose_cmd)
    
    if [ -n "$SERVICE" ]; then
        print_info "Showing logs for $SERVICE..."
        $compose_cmd logs -f "$SERVICE"
    else
        print_info "Showing logs for all services..."
        $compose_cmd logs -f
    fi
}

# Show status
show_status() {
    local compose_cmd=$(build_compose_cmd)
    
    print_info "Service Status:"
    $compose_cmd ps
    
    echo ""
    print_info "Container Health:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep auth_boilerplate || echo "No containers running"
}

# Clean up
clean_up() {
    local compose_cmd=$(build_compose_cmd)
    
    print_warning "This will remove all containers and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up containers and volumes..."
        $compose_cmd down -v --remove-orphans
        
        # Remove unused volumes
        docker volume prune -f
        
        print_status "Cleanup complete!"
    else
        print_info "Cleanup cancelled"
    fi
}

# Access backend shell
backend_shell() {
    print_info "Accessing microservice container shell..."
    
    # Try to access rest-api first, then event-queue
    if docker-compose exec rest-api sh 2>/dev/null; then
        return
    elif docker-compose exec event-queue sh 2>/dev/null; then
        return
    else
        print_error "No microservice containers are running"
        print_info "Start services first: ./scripts/docker-dev.sh start"
        print_info "Or specify a service: ./scripts/docker-dev.sh start --only-rest-api"
    fi
}

# Access database shell
database_shell() {
    print_info "Accessing database shell..."
    docker-compose exec database psql -U postgres -d auth_boilerplate || {
        print_error "Database container is not running"
        print_info "Start services first: ./scripts/docker-dev.sh start"
    }
}

# Health check
health_check() {
    print_info "Performing health check..."
    
    # Check if containers are running
    if docker-compose ps | grep -q "Up"; then
        print_status "Containers are running"
        
        # Check REST API if it's running
        if docker-compose ps | grep -q "rest_api.*Up"; then
            if curl -sf http://localhost:8080/ > /dev/null 2>&1; then
                print_status "REST API is responding"
            else
                print_warning "REST API is not responding"
            fi
        else
            print_info "REST API service is not running"
        fi
        
        # Check Event Queue if it's running
        if docker-compose ps | grep -q "event_queue.*Up"; then
            print_status "Event Queue service is running"
        else
            print_info "Event Queue service is not running"
        fi
        
        # Check database
        if docker-compose exec -T database pg_isready -U postgres > /dev/null 2>&1; then
            print_status "Database is ready"
        else
            print_warning "Database is not ready"
        fi
        
        # Check Redis
        if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
            print_status "Redis is ready"
        else
            print_warning "Redis is not ready"
        fi
    else
        print_error "No containers are running"
        print_info "Start services first: ./scripts/docker-dev.sh start"
    fi
}

# Main execution
main() {
    # Check if we're in the right directory
    if [ ! -f "docker-compose.yml" ]; then
        print_error "docker-compose.yml not found!"
        print_info "Please run this script from the project root directory"
        exit 1
    fi
    
    parse_args "$@"
    
    case $COMMAND in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        clean)
            clean_up
            ;;
        shell)
            backend_shell
            ;;
        db)
            database_shell
            ;;
        health)
            health_check
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