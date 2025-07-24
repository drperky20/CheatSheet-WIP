#!/bin/bash

# Security Check Script for AG-UI CheatSheet
# ==========================================
# This script checks for exposed secrets and sensitive data

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 AG-UI CheatSheet Security Audit${NC}"
echo "=================================="
echo

# Check if .env file exists and is not tracked
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    if git check-ignore .env >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} .env file is properly git-ignored"
    else
        echo -e "${RED}✗${NC} WARNING: .env file is NOT git-ignored!"
        echo "  Run: git rm --cached .env && git commit -m 'Remove .env from tracking'"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env file not found (using .env.example is ok for templates)"
fi

# Check for exposed API keys in tracked files
echo
echo -e "${BLUE}🔍 Scanning for exposed secrets...${NC}"

SECRET_PATTERNS=(
    "sk-[a-zA-Z0-9]{48}"          # OpenAI/OpenRouter keys
    "pk_test_[a-zA-Z0-9]{24,}"    # Stripe test keys
    "sk_test_[a-zA-Z0-9]{24,}"    # Stripe test keys
    "sk_live_[a-zA-Z0-9]{24,}"    # Stripe live keys
    "rk_live_[a-zA-Z0-9]{24,}"    # Stripe restricted keys
    "xoxb-[a-zA-Z0-9-]+"          # Slack bot tokens
    "ghp_[a-zA-Z0-9]{36}"         # GitHub personal access tokens
    "gho_[a-zA-Z0-9]{36}"         # GitHub OAuth tokens
    "AIza[a-zA-Z0-9_-]{35}"       # Google API keys
    "ya29\.[a-zA-Z0-9_-]+"        # Google OAuth tokens
    "[A-Za-z0-9]{40,}"            # Generic very long strings that might be keys
)

FOUND_ISSUES=0

for pattern in "${SECRET_PATTERNS[@]}"; do
    # Search in tracked files only (exclude .env and node_modules)
    matches=$(git ls-files | grep -v -E "\.env$|node_modules|\.git" | xargs grep -l -E "$pattern" 2>/dev/null || true)
    if [ ! -z "$matches" ]; then
        echo -e "${RED}✗${NC} Potential secret found matching pattern: $pattern"
        echo "  Files: $matches"
        FOUND_ISSUES=1
    fi
done

if [ $FOUND_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No exposed secrets found in tracked files"
fi

# Check for common sensitive files
echo
echo -e "${BLUE}📁 Checking for sensitive files...${NC}"

SENSITIVE_FILES=(
    "id_rsa"
    "id_dsa" 
    "id_ed25519"
    "*.pem"
    "*.key"
    "*.p12"
    "*.pfx"
    "secrets.json"
    "credentials.json"
    "service-account.json"
    ".aws/credentials"
    ".ssh/id_*"
)

for file_pattern in "${SENSITIVE_FILES[@]}"; do
    # Exclude files in dependencies and ignore legitimate certificate files
    found_files=$(find . -name "$file_pattern" -not -path "./node_modules/*" -not -path "./.git/*" -not -path "./.venv/*" -not -path "*/site-packages/*" | grep -v "cacert.pem" || true)
    if [ ! -z "$found_files" ]; then
        echo -e "${RED}✗${NC} Sensitive file found: $file_pattern"
        echo "  Files: $found_files"
        echo "  Make sure it's git-ignored and remove if committed"
        FOUND_ISSUES=1
    fi
done

if [ $FOUND_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No problematic sensitive files found"
fi

# Check .gitignore completeness
echo
echo -e "${BLUE}📋 Checking .gitignore completeness...${NC}"

REQUIRED_GITIGNORE_ENTRIES=(
    ".env"
    "*.key"
    "*.pem"
    "node_modules/"
    ".venv/"
    "logs/"
    ".DS_Store"
)

if [ -f ".gitignore" ]; then
    for entry in "${REQUIRED_GITIGNORE_ENTRIES[@]}"; do
        if ! grep -q "$entry" .gitignore; then
            echo -e "${YELLOW}⚠${NC} Missing from .gitignore: $entry"
        fi
    done
    echo -e "${GREEN}✓${NC} .gitignore file exists"
else
    echo -e "${RED}✗${NC} .gitignore file missing!"
    FOUND_ISSUES=1
fi

# Check for hardcoded localhost URLs in production files (excluding fallbacks)
echo
echo -e "${BLUE}🌐 Checking for problematic hardcoded URLs...${NC}"

# Only flag localhost URLs that don't have environment variable fallbacks
problematic_localhost=$(git ls-files | xargs grep -l "localhost:[0-9]" 2>/dev/null | xargs grep -L "process\.env\." 2>/dev/null | grep -v -E "README|\.md$|start\.|route\.ts$" || true)
if [ ! -z "$problematic_localhost" ]; then
    echo -e "${YELLOW}⚠${NC} Hardcoded localhost URLs without env fallbacks found in:"
    echo "  $problematic_localhost"
    echo "  Consider using environment variables for URLs"
else
    echo -e "${GREEN}✓${NC} No problematic hardcoded URLs found"
fi

# Summary
echo
echo -e "${BLUE}📊 Security Audit Summary${NC}"
echo "========================="

if [ $FOUND_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Security audit passed!${NC}"
    echo "This codebase appears safe for GitHub publication."
else
    echo -e "${RED}❌ Security issues found!${NC}"
    echo "Please address the issues above before publishing to GitHub."
    exit 1
fi

echo
echo -e "${BLUE}💡 Additional Security Tips:${NC}"
echo "• Rotate any API keys that may have been exposed"
echo "• Use environment variables for all secrets"
echo "• Review git history for accidentally committed secrets"
echo "• Consider using git-secrets or similar tools"
echo "• Set up branch protection rules on GitHub"

exit 0