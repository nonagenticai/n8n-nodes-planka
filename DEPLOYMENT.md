# Deployment Guide - kanban

This guide provides step-by-step instructions for deploying the Kanban (Planka) node to n8n.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation Methods](#installation-methods)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)
6. [Production Deployment](#production-deployment)

---

## Prerequisites

### Required Software
- Node.js 18.x or higher
- npm 8.x or higher
- n8n 0.200.0 or higher
- Access to a Planka instance (for testing)

### Verify Prerequisites
```bash
node --version    # Should be v18.x or higher
npm --version     # Should be 8.x or higher
n8n --version     # Should be 0.200.0 or higher
```

### Build Requirements
```bash
# Clone the repository
git clone <repository-url>
cd kanban

# Install dependencies
npm install

# Verify build succeeds
npm run build
```

Expected output:
- `dist/` directory created
- 98 files generated (49 .js + 49 .d.ts)
- No TypeScript errors
- Total size: ~460KB

---

## Installation Methods

### Method 1: Local Development (Recommended for Testing)

Best for: Testing and development

```bash
# 1. Build the node
cd /path/to/kanban
npm install
npm run build

# 2. Link the package
npm link

# 3. Link to n8n
cd ~/.n8n/custom
npm link kanban

# 4. Restart n8n
n8n restart
```

### Method 2: Direct Installation (npm)

Best for: Production deployment when published to npm

```bash
# If published to npm
cd ~/.n8n/custom
npm install kanban

# Restart n8n
n8n restart
```

### Method 3: Docker Installation

Best for: Containerized n8n deployments

#### Option A: Build and Copy
```bash
# 1. Build the node on host
cd /path/to/kanban
npm install
npm run build

# 2. Copy to running container
docker cp ./dist n8n-container:/home/node/.n8n/custom/kanban
docker cp ./package.json n8n-container:/home/node/.n8n/custom/kanban/

# 3. Install in container
docker exec n8n-container sh -c "cd /home/node/.n8n/custom/kanban && npm install --production"

# 4. Restart container
docker restart n8n-container
```

#### Option B: Volume Mount
```yaml
# docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
      - ./kanban:/home/node/.n8n/custom/kanban
    environment:
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
volumes:
  n8n_data:
```

Then:
```bash
# Build first
cd kanban
npm run build

# Start with docker-compose
docker-compose up -d
```

### Method 4: Manual Copy Installation

Best for: Quick testing without npm link

```bash
# 1. Build the node
cd /path/to/kanban
npm install
npm run build

# 2. Create custom nodes directory
mkdir -p ~/.n8n/custom/kanban

# 3. Copy files
cp -r dist ~/.n8n/custom/kanban/
cp package.json ~/.n8n/custom/kanban/
cp package-lock.json ~/.n8n/custom/kanban/

# 4. Install dependencies
cd ~/.n8n/custom/kanban
npm install --production

# 5. Restart n8n
n8n restart
```

---

## Configuration

### Step 1: Create Planka API Credentials

1. Open n8n: `http://localhost:5678` (or your n8n URL)
2. Navigate to: **Settings** → **Credentials** → **New**
3. Search for: "Planka Kanban API"
4. Configure credentials:

#### Using Username & Password (Recommended)
```
Name: My Planka Instance
Planka Base URL: https://planka.example.com

Email or Username: your-username@example.com
Password: your-password
```

### Step 2: Test Credentials

1. In credential configuration, click **Test Connection**
2. Should see: "Connection successful"
3. If fails, check:
   - Base URL is correct (include protocol: http:// or https://)
   - Credentials are valid
   - Planka instance is accessible
   - No firewall blocking connection

### Network Configuration

#### For Docker Deployments
```bash
# DO NOT use localhost in Docker
# ✗ Wrong: http://localhost:3333
# ✓ Correct: http://planka.example.com
# ✓ Correct: http://192.0.2.10:3333
# ✓ Correct: http://planka.example.com:3333

# Test connectivity from n8n container
docker exec n8n-container curl http://planka.example.com/health
```

#### For .local Domains (Bonjour/mDNS)
```bash
# Ensure n8n container can resolve .local domains
# Add to docker-compose.yml:
services:
  n8n:
    dns:
      - 192.0.2.1  # Your DNS server
    extra_hosts:
      - "planka.test:192.0.2.10"
```

---

## Testing

### Verification Checklist

#### 1. Node Appears in n8n
```bash
# Check n8n UI:
# 1. Open workflow editor
# 2. Click "+" to add node
# 3. Search for "Planka"
# 4. Should see "Planka" node

# If not visible:
# - Check n8n logs for errors
# - Verify dist/ files exist
# - Restart n8n
```

#### 2. Credentials Test
```bash
# In n8n:
# 1. Create Planka credentials
# 2. Enter valid Planka URL and credentials
# 3. Click "Test Connection"
# Expected: "Connection successful"
```

#### 3. Basic Operation Test
```bash
# Create a simple workflow:
# 1. Add "Manual Trigger" node
# 2. Add "Planka" node
# 3. Select resource: "Project"
# 4. Select operation: "List"
# 5. Execute workflow
# Expected: List of projects returned
```

#### 4. Create Project Test
```bash
# Test create operation:
# 1. Add "Planka" node
# 2. Resource: "Project"
# 3. Operation: "Create"
# 4. Name: "Test Project"
# 5. Execute workflow
# Expected: New project created with ID
```

### Integration Test Script
```bash
# Run automated tests (requires Planka instance)
cd /path/to/kanban

# Set environment variables
export PLANKA_BASE_URL=http://planka.example.com
export PLANKA_USERNAME=test@example.com
export PLANKA_PASSWORD=testpassword

# Run integration tests
npm run test:integration
```

### Test Coverage
```bash
# Check code coverage
npm run test:coverage

# Expected results:
# Statements: 79.11%
# Branches: 67.66%
# Functions: 86.3%
# Lines: 81.27%
```

---

## Troubleshooting

### Node Doesn't Appear in n8n

**Symptom**: Planka node not in node list

**Solutions**:
```bash
# 1. Check build succeeded
cd /path/to/kanban
npm run build
ls -la dist/  # Verify files exist

# 2. Check n8n logs
n8n start --log-level=debug

# 3. Verify package.json n8n section
cat package.json | grep -A 5 '"n8n":'

# Expected:
# "n8n": {
#   "nodes": ["dist/nodes/Planka/Planka.node.js"],
#   "credentials": ["dist/credentials/PlankaApi.credentials.js"]
# }

# 4. Clear n8n cache
rm -rf ~/.n8n/.cache
n8n restart

# 5. Reinstall node
cd ~/.n8n/custom
rm -rf kanban
# Then reinstall using Method 1-4
```

### Authentication Fails

**Symptom**: "Invalid credentials" or "Authentication failed"

**Solutions**:
```bash
# 1. Test Planka API directly
curl -X POST http://planka.example.com/api/access-tokens \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"test@example.com","password":"testpass"}'

# Should return access token

# 2. Check base URL format
# ✓ Correct: http://planka.example.com
# ✓ Correct: https://planka.example.com
# ✗ Wrong: planka.example.com (missing protocol)
# ✗ Wrong: http://planka.example.com/ (trailing slash)

# 3. Verify terms accepted
# Some Planka instances require terms acceptance
# Log into Planka web UI first to accept terms

# 4. Check credentials in Planka
# Log into Planka web UI with same credentials
```

### API Connection Timeout

**Symptom**: "Request timeout" or "ECONNREFUSED"

**Solutions**:
```bash
# 1. Test network connectivity
ping planka.example.com
telnet planka.example.com 3333

# 2. For Docker: Use proper hostname
# ✗ Wrong: http://localhost:3333
# ✓ Correct: http://planka.example.com

# 3. Check firewall
sudo ufw status  # Linux
# Ensure Planka port (usually 3333) is open

# 4. For internal domains (.local)
# Test from n8n container:
docker exec n8n-container ping planka.example.com
docker exec n8n-container curl http://planka.example.com:3333/health

# 5. Add to /etc/hosts if DNS fails
# On host:
echo "192.0.2.10  planka.test" | sudo tee -a /etc/hosts

# In Docker:
# Add extra_hosts to docker-compose.yml
```

### Operation Errors

**Symptom**: "Resource not found" or "Invalid request"

**Solutions**:
```bash
# 1. Check operation parameters
# Each operation has required fields
# Review field descriptions in n8n UI

# 2. Verify resource IDs
# IDs must be valid UUIDs from Planka
# Get valid IDs using List operations first

# 3. Check API compatibility
# Ensure Planka version is compatible
# Node tested with Planka 1.0+

# 4. Enable debug logging
# In n8n workflow:
# Settings → Log Level → Debug
```

### Build Errors

**Symptom**: TypeScript compilation fails

**Solutions**:
```bash
# 1. Clean and rebuild
rm -rf dist node_modules package-lock.json
npm install
npm run build

# 2. Check TypeScript version
npm list typescript
# Should match version in package.json

# 3. Verify Node.js version
node --version
# Should be v18.x or higher

# 4. Check for syntax errors
npm run lint
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] Test coverage >75% (`npm run test:coverage`)
- [ ] Build succeeds (`npm run build`)
- [ ] Integration tests pass with real Planka instance
- [ ] Documentation reviewed
- [ ] Security audit clean (`npm audit`)

### Production Best Practices

#### 1. Use a Dedicated Planka User
```bash
# Create a dedicated Planka user for n8n
# Give it only the board permissions the workflows need
# Never reuse a personal administrator login
```

#### 2. Monitor Node Performance
```bash
# Enable n8n metrics
# Monitor:
# - Execution times
# - Error rates
# - API response times
```

#### 3. Set Up Error Handling
```javascript
// In n8n workflows:
// 1. Enable "Continue on Fail" for non-critical operations
// 2. Add error handling nodes
// 3. Set up notifications for failures
```

#### 4. Version Pinning
```json
// In package.json for production:
{
  "dependencies": {
    "n8n-workflow": "1.0.0",  // Pin exact versions
    "n8n-core": "1.0.0"
  }
}
```

#### 5. Backup Strategy
```bash
# Backup n8n data including custom nodes
tar -czf n8n-backup-$(date +%Y%m%d).tar.gz ~/.n8n/

# For Docker:
docker run --rm \
  -v n8n_data:/data \
  -v $(pwd):/backup \
  alpine tar -czf /backup/n8n-backup.tar.gz /data
```

### Deployment to Multiple Environments

#### Development
```bash
# Use npm link for easy updates
cd /path/to/kanban
npm link
cd ~/.n8n/custom
npm link kanban
```

#### Staging
```bash
# Use specific version
cd ~/.n8n/custom
npm install /path/to/kanban
```

#### Production
```bash
# Use published npm package
cd ~/.n8n/custom
npm install kanban@1.0.1
```

### Health Checks

```bash
# Periodic verification script
#!/bin/bash
# check-planka-node.sh

# 1. Check node files exist
if [ ! -f ~/.n8n/custom/kanban/dist/nodes/Planka/Planka.node.js ]; then
  echo "ERROR: Planka node files missing"
  exit 1
fi

# 2. Check n8n running
if ! pgrep -x "n8n" > /dev/null; then
  echo "ERROR: n8n not running"
  exit 1
fi

# 3. Check API connectivity
if ! curl -sf http://planka.example.com/health > /dev/null; then
  echo "WARNING: Planka API unreachable"
fi

echo "OK: Planka node healthy"
```

### Rollback Procedure

```bash
# If deployment fails:

# 1. Stop n8n
n8n stop

# 2. Remove new version
cd ~/.n8n/custom
rm -rf kanban

# 3. Restore previous version
cp -r /backup/kanban ~/.n8n/custom/

# 4. Restart n8n
n8n start

# 5. Verify
# Test basic operation in n8n UI
```

---

## Support

### Getting Help

1. **Documentation**: [README.md](./README.md)
2. **API Coverage**: [docs/node-reference.md](./docs/node-reference.md)
3. **Issues**: [GitHub Issues](https://github.com/nonagenticai/n8n-nodes-planka/issues)
4. **n8n Community**: [community.n8n.io](https://community.n8n.io)

### Reporting Issues

When reporting issues, include:
- n8n version
- Node.js version
- Planka version
- Node version (from package.json)
- Error messages (full stack trace)
- Steps to reproduce

### Version Information

```bash
# Check versions
n8n --version
node --version
npm list @nonagenticai/n8n-nodes-planka
```

---

**Last Updated**: November 27, 2025
**Node Version**: 0.1.1
**Tested with**: n8n 1.0.0+, Node.js 18.x+, Planka 1.0+
