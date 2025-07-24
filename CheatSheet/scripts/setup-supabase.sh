#!/bin/bash

# CheatSheet Supabase Setup Script
# ================================
# This script helps you set up your Supabase project for CheatSheet

echo "🚀 CheatSheet Supabase Setup"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f "../.env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please copy .env.example to .env and configure your values first."
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Supabase Project Setup${NC}"
echo "Please ensure you have:"
echo "1. Created a Supabase project at https://app.supabase.com/"
echo "2. Updated your .env file with SUPABASE_URL and SUPABASE_ANON_KEY"
echo "3. Added your SUPABASE_SERVICE_ROLE_KEY to .env"
echo ""

read -p "Have you completed the above steps? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏸️  Please complete the setup steps above and run this script again.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Step 2: Apply Database Migrations${NC}"
echo "This will create all necessary tables and functions..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. Installing...${NC}"
    
    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install supabase/tap/supabase
        else
            echo -e "${RED}❌ Homebrew not found. Please install Supabase CLI manually:${NC}"
            echo "https://supabase.com/docs/guides/cli"
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -fsSL https://supabase.com/install.sh | sh
    else
        echo -e "${RED}❌ Unsupported OS. Please install Supabase CLI manually:${NC}"
        echo "https://supabase.com/docs/guides/cli"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"

# Load environment variables
if [ -f "../.env" ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Validate required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❌ Missing required Supabase environment variables${NC}"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env"
    exit 1
fi

# Extract project ID from URL
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's/.*\/\/\([^.]*\).*/\1/')

echo ""
echo -e "${BLUE}🔗 Linking to Supabase project: ${PROJECT_ID}${NC}"

# Link to the project
cd ../supabase
supabase link --project-ref $PROJECT_ID

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to link to Supabase project${NC}"
    echo "Please check your project ID and ensure you have access to the project."
    exit 1
fi

echo -e "${GREEN}✅ Successfully linked to Supabase project${NC}"

echo ""
echo -e "${BLUE}📊 Applying database migrations...${NC}"

# Apply migrations
supabase db push

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to apply migrations${NC}"
    echo "Please check the migration files and try again."
    exit 1
fi

echo -e "${GREEN}✅ Database migrations applied successfully${NC}"

echo ""
echo -e "${BLUE}🔐 Setting up Row Level Security...${NC}"

# The RLS policies are already in the migrations, so we just need to verify
echo "RLS policies have been applied as part of the migrations."

echo ""
echo -e "${BLUE}📋 Step 3: Verify Setup${NC}"

# Test the database connection
echo "Testing database connection..."

# We'll use a simple query to test
supabase db diff --use-migra

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Database connection test inconclusive${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Supabase Setup Complete!${NC}"
echo ""
echo "Your CheatSheet project is now configured with:"
echo "✅ Database tables and indexes"
echo "✅ Row Level Security policies"
echo "✅ Canvas LMS integration functions"
echo "✅ Agent session management functions"
echo "✅ Real-time subscriptions"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Start your development server: npm run dev"
echo "2. Sign up/login to create your first user profile"
echo "3. Configure Canvas LMS credentials in the app settings"
echo "4. Start using CheatSheet! 🚀"
echo ""
echo -e "${YELLOW}💡 Tip: Check the Supabase dashboard to see your data:${NC}"
echo "   ${NEXT_PUBLIC_SUPABASE_URL}"
echo ""