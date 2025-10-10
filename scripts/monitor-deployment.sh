#!/bin/bash

# Monitor GitHub Actions deployment
REPO="Alkeme-Insurance/fast_azure"
RUN_ID=$(gh run list --repo $REPO --limit 1 --json databaseId --jq '.[0].databaseId')

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Monitoring Deployment - Run ID: $RUN_ID         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔗 View in browser: https://github.com/$REPO/actions/runs/$RUN_ID"
echo ""

while true; do
  clear
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║         Monitoring Deployment - Run ID: $RUN_ID         ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo ""
  
  # Get status
  STATUS=$(gh run view $RUN_ID --repo $REPO --json status,conclusion,startedAt --jq '{status: .status, conclusion: .conclusion, started: .startedAt}')
  
  echo "$STATUS" | jq -r '"Status: \(.status)"'
  if [ "$(echo "$STATUS" | jq -r '.conclusion')" != "null" ]; then
    echo "$STATUS" | jq -r '"Result: \(.conclusion)"'
  fi
  echo "$STATUS" | jq -r '"Started: \(.started)"'
  echo ""
  
  # Get jobs
  echo "═══════════════════════════════════════════════════════════════"
  echo "Jobs:"
  echo "═══════════════════════════════════════════════════════════════"
  gh run view $RUN_ID --repo $REPO --json jobs --jq '.jobs[] | "[\(.conclusion // .status | ascii_upcase)] \(.name)"'
  echo ""
  
  # Check if completed
  WORKFLOW_STATUS=$(echo "$STATUS" | jq -r '.status')
  if [ "$WORKFLOW_STATUS" = "completed" ]; then
    CONCLUSION=$(echo "$STATUS" | jq -r '.conclusion')
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    if [ "$CONCLUSION" = "success" ]; then
      echo "✅ DEPLOYMENT SUCCESSFUL!"
      echo "═══════════════════════════════════════════════════════════════"
      echo ""
      echo "Getting application URL..."
      gh run view $RUN_ID --repo $REPO --log | grep "Application URL:" | tail -1
    else
      echo "❌ DEPLOYMENT FAILED!"
      echo "═══════════════════════════════════════════════════════════════"
      echo ""
      echo "Viewing failed logs..."
      gh run view $RUN_ID --repo $REPO --log-failed | tail -50
    fi
    break
  fi
  
  echo "Refreshing in 10 seconds... (Ctrl+C to stop)"
  sleep 10
done
