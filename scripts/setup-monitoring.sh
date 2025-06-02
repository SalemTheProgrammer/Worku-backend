#!/bin/bash

echo "🚀 Setting up Grafana & Prometheus monitoring for Lintern..."

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install prom-client @willsoto/nestjs-prometheus

# Create directories if they don't exist
echo "📁 Creating monitoring directories..."
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/prometheus

# Start the monitoring stack
echo "🐳 Starting monitoring stack with Docker Compose..."
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker-compose.monitoring.yml ps

echo ""
echo "✅ Monitoring setup complete!"
echo ""
echo "🌐 Access URLs:"
echo "   - Prometheus: http://localhost:9090"
echo "   - Grafana: http://localhost:3001 (admin/lintern123)"
echo "   - Node Exporter: http://localhost:9100"
echo "   - Redis Exporter: http://localhost:9121"
echo ""
echo "📊 Your NestJS app metrics will be available at: http://localhost:3000/metrics"
echo ""
echo "🎯 Next steps:"
echo "   1. Restart your NestJS application to enable metrics collection"
echo "   2. Open Grafana and check the 'Lintern Overview' dashboard"
echo "   3. Configure alerts in Prometheus if needed"