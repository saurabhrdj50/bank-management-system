#!/bin/bash

# Bank Management System - API Test Script
# This script tests all critical API endpoints

BASE_URL="http://localhost:5000/api"
TOKEN=""

echo "=================================="
echo "Bank Management System API Tests"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
    fi
}

# Function to extract token from response
extract_token() {
    TOKEN=$(echo "$1" | grep -o '"token":"[^"]*"' | sed 's/"token":"//;s/"//')
}

echo -e "${YELLOW}1. Testing Health Check${NC}"
HEALTH=$(curl -s "$BASE_URL/health")
if echo "$HEALTH" | grep -q "Server is running"; then
    print_result 0 "Health check"
else
    print_result 1 "Health check"
fi
echo ""

echo -e "${YELLOW}2. Testing User Registration${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "test@example.com",
        "password": "TestPass123!",
        "confirmPassword": "TestPass123!",
        "firstName": "Test",
        "lastName": "User",
        "phone": "+919876543210"
    }')

if echo "$REGISTER_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "User registration"
    extract_token "$REGISTER_RESPONSE"
    echo "Token extracted: ${TOKEN:0:50}..."
else
    print_result 1 "User registration"
    echo "Response: $REGISTER_RESPONSE"
fi
echo ""

echo -e "${YELLOW}3. Testing User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "user@bank.com",
        "password": "password"
    }')

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    print_result 0 "User login"
    extract_token "$LOGIN_RESPONSE"
    echo "Token extracted: ${TOKEN:0:50}..."
else
    print_result 1 "User login"
    echo "Response: $LOGIN_RESPONSE"
fi
echo ""

if [ -n "$TOKEN" ]; then
    echo -e "${YELLOW}4. Testing Get Profile (Authenticated)${NC}"
    PROFILE=$(curl -s "$BASE_URL/auth/profile" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$PROFILE" | grep -q '"success":true'; then
        print_result 0 "Get user profile"
    else
        print_result 1 "Get user profile"
    fi
    echo ""

    echo -e "${YELLOW}5. Testing Get Accounts (Authenticated)${NC}"
    ACCOUNTS=$(curl -s "$BASE_URL/accounts" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$ACCOUNTS" | grep -q '"success":true'; then
        print_result 0 "Get user accounts"
    else
        print_result 1 "Get user accounts"
    fi
    echo ""

    echo -e "${YELLOW}6. Testing Get Transactions (Authenticated)${NC}"
    TRANSACTIONS=$(curl -s "$BASE_URL/transactions" \
        -H "Authorization: Bearer $TOKEN")
    
    if echo "$TRANSACTIONS" | grep -q '"success":true'; then
        print_result 0 "Get transaction history"
    else
        print_result 1 "Get transaction history"
    fi
    echo ""

    echo -e "${YELLOW}7. Testing Deposit (Authenticated)${NC}"
    # First get an account ID
    ACCOUNT_ID=$(echo "$ACCOUNTS" | grep -o '"_id":"[^"]*"' | head -1 | sed 's/"_id":"//;s/"//')
    
    if [ -n "$ACCOUNT_ID" ]; then
        DEPOSIT=$(curl -s -X POST "$BASE_URL/accounts/$ACCOUNT_ID/deposit" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"amount": 1000, "description": "Test deposit"}')
        
        if echo "$DEPOSIT" | grep -q '"success":true'; then
            print_result 0 "Deposit money"
        else
            print_result 1 "Deposit money"
        fi
    else
        print_result 1 "Deposit money (no account found)"
    fi
    echo ""

    echo -e "${YELLOW}8. Testing Unauthorized Access${NC}"
    UNAUTHORIZED=$(curl -s "$BASE_URL/accounts")
    
    if echo "$UNAUTHORIZED" | grep -q '"success":false\|Unauthorized\|token"; then
        print_result 0 "Unauthorized access blocked"
    else
        print_result 1 "Unauthorized access blocked"
    fi
    echo ""
else
    echo -e "${RED}Skipping authenticated tests - no valid token${NC}"
    echo ""
fi

echo "=================================="
echo "Test Summary Complete"
echo "=================================="
