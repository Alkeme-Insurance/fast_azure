# 🔍 GitHub Actions Monitoring Guide

## Quick Commands

### Watch Latest Workflow Run
```bash
# Watch the most recent workflow run in real-time
gh run watch --repo Alkeme-Insurance/fast_azure

# Watch and show exit status when done
gh run watch --repo Alkeme-Insurance/fast_azure --exit-status
```

### List All Workflow Runs
```bash
# Show recent workflow runs
gh run list --repo Alkeme-Insurance/fast_azure

# Show with more details
gh run list --repo Alkeme-Insurance/fast_azure --limit 10

# Show only failed runs
gh run list --repo Alkeme-Insurance/fast_azure --status failure

# Show only in-progress runs
gh run list --repo Alkeme-Insurance/fast_azure --status in_progress
```

### View Specific Run Details
```bash
# Get the run ID first
gh run list --repo Alkeme-Insurance/fast_azure --limit 1

# View details of a specific run (replace <RUN_ID> with actual ID)
gh run view <RUN_ID> --repo Alkeme-Insurance/fast_azure

# View with full logs
gh run view <RUN_ID> --repo Alkeme-Insurance/fast_azure --log

# View only failed logs
gh run view <RUN_ID> --repo Alkeme-Insurance/fast_azure --log-failed
```

### Watch Specific Run
```bash
# Get the run ID
RUN_ID=$(gh run list --repo Alkeme-Insurance/fast_azure --limit 1 --json databaseId --jq '.[0].databaseId')

# Watch that specific run
gh run watch $RUN_ID --repo Alkeme-Insurance/fast_azure
```

---

## 📊 Detailed Examples

### 1. List Recent Runs with Status
```bash
gh run list --repo Alkeme-Insurance/fast_azure --limit 5 --json status,conclusion,headBranch,createdAt,databaseId --jq '.[] | "\(.databaseId) \(.status) \(.conclusion // "running") \(.headBranch) \(.createdAt)"'
```

**Output example:**
```
123456789 completed failure main 2025-10-03T16:39:52Z
123456788 completed success main 2025-10-03T15:20:15Z
123456787 in_progress null main 2025-10-03T16:45:00Z
```

### 2. Get Latest Failed Run ID
```bash
FAILED_RUN_ID=$(gh run list \
  --repo Alkeme-Insurance/fast_azure \
  --status failure \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')

echo "Latest failed run: $FAILED_RUN_ID"
```

### 3. View Failed Run Logs
```bash
# Get latest failed run
FAILED_RUN_ID=$(gh run list \
  --repo Alkeme-Insurance/fast_azure \
  --status failure \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')

# View only the failed steps
gh run view $FAILED_RUN_ID \
  --repo Alkeme-Insurance/fast_azure \
  --log-failed
```

### 4. Download Logs for Analysis
```bash
# Download logs of the latest run
LATEST_RUN_ID=$(gh run list \
  --repo Alkeme-Insurance/fast_azure \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')

# Download logs to a zip file
gh run download $LATEST_RUN_ID \
  --repo Alkeme-Insurance/fast_azure \
  --log

# Extract and view
unzip -l run-$LATEST_RUN_ID-logs.zip
```

### 5. Watch and Get Notification
```bash
# Watch and beep when done
gh run watch --repo Alkeme-Insurance/fast_azure && echo -e "\a" && notify-send "GitHub Actions Complete"

# Watch and show desktop notification (Linux)
gh run watch --repo Alkeme-Insurance/fast_azure --exit-status && \
  notify-send "GitHub Actions" "Workflow completed!"
```

---

## 🔴 Troubleshooting Failed Runs

### Step 1: Identify the Failed Run
```bash
# List recent failed runs
gh run list \
  --repo Alkeme-Insurance/fast_azure \
  --status failure \
  --limit 5
```

### Step 2: View Failed Run Summary
```bash
# Get the failed run ID from step 1
FAILED_RUN_ID=<YOUR_RUN_ID>

# View summary
gh run view $FAILED_RUN_ID --repo Alkeme-Insurance/fast_azure
```

**Output includes:**
- ✓ Workflow name
- ✓ Trigger event
- ✓ Commit SHA and message
- ✓ Job statuses
- ✓ Failed steps

### Step 3: View Failed Logs Only
```bash
# View only failed steps
gh run view $FAILED_RUN_ID \
  --repo Alkeme-Insurance/fast_azure \
  --log-failed
```

### Step 4: View Full Logs
```bash
# View complete logs (warning: can be very long)
gh run view $FAILED_RUN_ID \
  --repo Alkeme-Insurance/fast_azure \
  --log | less
```

### Step 5: Search for Specific Error
```bash
# Search for "Error:" in logs
gh run view $FAILED_RUN_ID \
  --repo Alkeme-Insurance/fast_azure \
  --log | grep -i "error:"

# Search for Azure CLI errors
gh run view $FAILED_RUN_ID \
  --repo Alkeme-Insurance/fast_azure \
  --log | grep -A 5 "az:"

# Search for AADSTS errors (Azure AD)
gh run view $FAILED_RUN_ID \
  --repo Alkeme-Insurance/fast_azure \
  --log | grep -A 10 "AADSTS"
```

---

## 🎯 Common Error Patterns

### Azure Login Errors
```bash
# Search for authentication errors
gh run view $FAILED_RUN_ID \
  --repo Alkeme-Insurance/fast_azure \
  --log | grep -E "(AADSTS|Login failed|authentication)"
```

**Common errors:**
- `AADSTS70025` - No federated identity credentials
- `AADSTS700016` - Application not found
- `Login failed` - Wrong client ID or tenant ID

### Build Errors
```bash
# Search for build failures
gh run view $FAILED_RUN_ID \
  --repo Alkeme-Insurance/fast_azure \
  --log | grep -E "(Build failed|error:|ERROR:)"
```

### Deployment Errors
```bash
# Search for kubectl/deployment errors
gh run view $FAILED_RUN_ID \
  --repo Alkeme-Insurance/fast_azure \
  --log | grep -E "(kubectl|deployment|failed to|Error from server)"
```

---

## 📱 Real-Time Monitoring

### Monitor Current Deployment
```bash
# One-liner to watch and show result
gh run watch --repo Alkeme-Insurance/fast_azure --exit-status || \
  (echo "❌ Workflow failed!" && gh run view --log-failed --repo Alkeme-Insurance/fast_azure)
```

### Continuous Monitoring Script
```bash
#!/bin/bash
# Save as monitor-actions.sh

REPO="Alkeme-Insurance/fast_azure"

echo "🔍 Monitoring GitHub Actions for $REPO"
echo "Press Ctrl+C to stop"
echo ""

while true; do
  # Get latest run status
  STATUS=$(gh run list --repo $REPO --limit 1 --json status,conclusion --jq '.[0] | "\(.status) \(.conclusion // "running")"')
  TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
  
  echo "[$TIMESTAMP] Status: $STATUS"
  
  # If completed, show result and exit
  if [[ $STATUS == *"completed"* ]]; then
    if [[ $STATUS == *"success"* ]]; then
      echo "✅ Workflow succeeded!"
    else
      echo "❌ Workflow failed!"
      echo ""
      echo "Failed logs:"
      gh run view --repo $REPO --log-failed
    fi
    break
  fi
  
  sleep 10
done
```

**Usage:**
```bash
chmod +x monitor-actions.sh
./monitor-actions.sh
```

---

## 🔧 Advanced Usage

### Get Workflow Run URL
```bash
# Get URL of latest run
gh run list \
  --repo Alkeme-Insurance/fast_azure \
  --limit 1 \
  --json url \
  --jq '.[0].url'

# Open in browser
gh run view --web --repo Alkeme-Insurance/fast_azure
```

### Re-run Failed Workflow
```bash
# Get failed run ID
FAILED_RUN_ID=$(gh run list \
  --repo Alkeme-Insurance/fast_azure \
  --status failure \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')

# Re-run it
gh run rerun $FAILED_RUN_ID --repo Alkeme-Insurance/fast_azure

# Watch the re-run
gh run watch --repo Alkeme-Insurance/fast_azure
```

### Cancel Running Workflow
```bash
# Get in-progress run ID
RUNNING_RUN_ID=$(gh run list \
  --repo Alkeme-Insurance/fast_azure \
  --status in_progress \
  --limit 1 \
  --json databaseId \
  --jq '.[0].databaseId')

# Cancel it
gh run cancel $RUNNING_RUN_ID --repo Alkeme-Insurance/fast_azure
```

### Trigger Workflow Manually
```bash
# Trigger the deploy workflow
gh workflow run deploy.yml --repo Alkeme-Insurance/fast_azure

# Watch it
sleep 5 && gh run watch --repo Alkeme-Insurance/fast_azure
```

---

## 📋 Useful Aliases

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# GitHub Actions shortcuts
alias ghr='gh run list --repo Alkeme-Insurance/fast_azure'
alias ghrw='gh run watch --repo Alkeme-Insurance/fast_azure --exit-status'
alias ghrf='gh run list --repo Alkeme-Insurance/fast_azure --status failure --limit 5'
alias ghrv='gh run view --repo Alkeme-Insurance/fast_azure'
alias ghrl='gh run view --repo Alkeme-Insurance/fast_azure --log-failed'

# Get latest failed run logs
alias ghr-failed='gh run view $(gh run list --repo Alkeme-Insurance/fast_azure --status failure --limit 1 --json databaseId --jq ".[0].databaseId") --repo Alkeme-Insurance/fast_azure --log-failed'

# Open latest run in browser
alias ghr-web='gh run view --web --repo Alkeme-Insurance/fast_azure'
```

**Usage after adding aliases:**
```bash
ghr          # List runs
ghrw         # Watch latest
ghrf         # List failed runs
ghr-failed   # Show latest failure logs
ghr-web      # Open in browser
```

---

## 🎬 Quick Start for Your Current Issue

### Check the Failed Run
```bash
# 1. List recent runs
gh run list --repo Alkeme-Insurance/fast_azure --limit 3

# 2. Get the failed run ID (the one with "failure")
FAILED_RUN_ID=<ID_FROM_ABOVE>

# 3. View what failed
gh run view $FAILED_RUN_ID --repo Alkeme-Insurance/fast_azure

# 4. View only failed logs
gh run view $FAILED_RUN_ID --repo Alkeme-Insurance/fast_azure --log-failed

# 5. Search for the AADSTS error
gh run view $FAILED_RUN_ID --repo Alkeme-Insurance/fast_azure --log | grep -A 20 "AADSTS"
```

### Watch for Next Deployment
```bash
# After you update the AZURE_CLIENT_ID secret (once deployment completes)
# Trigger a new run and watch it
git commit --allow-empty -m "Retry with new identity"
git push origin main

# Watch it (will auto-refresh)
gh run watch --repo Alkeme-Insurance/fast_azure --exit-status
```

---

## 📚 Related Commands

### View Workflow Definitions
```bash
# List all workflows
gh workflow list --repo Alkeme-Insurance/fast_azure

# View specific workflow
gh workflow view deploy.yml --repo Alkeme-Insurance/fast_azure
```

### View Repository Actions
```bash
# Open Actions tab in browser
gh browse --repo Alkeme-Insurance/fast_azure /actions
```

---

## 💡 Pro Tips

1. **Use `--exit-status`** to get non-zero exit code on failure:
   ```bash
   gh run watch --repo Alkeme-Insurance/fast_azure --exit-status && echo "✅ Success!"
   ```

2. **Pipe to `less` for long logs**:
   ```bash
   gh run view <RUN_ID> --repo Alkeme-Insurance/fast_azure --log | less
   ```

3. **Use `--json` for scripting**:
   ```bash
   gh run list --repo Alkeme-Insurance/fast_azure --json status,conclusion,databaseId
   ```

4. **Combine with `jq` for filtering**:
   ```bash
   gh run list --repo Alkeme-Insurance/fast_azure --json status,conclusion,databaseId --jq '.[] | select(.conclusion=="failure")'
   ```

5. **Watch multiple repos** with a loop:
   ```bash
   for repo in org/repo1 org/repo2; do
     echo "Watching $repo..."
     gh run watch --repo $repo
   done
   ```

---

**Now you're a GitHub Actions monitoring pro! 🚀**
