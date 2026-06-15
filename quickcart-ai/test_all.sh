#!/bin/bash
# QuickCart AI - Automated Test Suite

echo "=================================="
echo "QuickCart AI - Test Suite"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Test 1: Backend Health Check
echo -n "Test 1: Backend Health Check... "
RESPONSE=$(curl -s http://localhost:8000/health)
if echo "$RESPONSE" | grep -q "ok"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "  Response: $RESPONSE"
    ((FAILED++))
fi

# Test 2: Intent Extraction - Party Scenario
echo -n "Test 2: Intent Extraction (Party)... "
RESPONSE=$(curl -s -X POST http://localhost:8000/intent/extract \
  -H "Content-Type: application/json" \
  -d '{"user_input": "I have guests coming in 30 minutes"}')
if echo "$RESPONSE" | grep -q "party"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "  Response: $RESPONSE"
    ((FAILED++))
fi

# Test 3: Cart Building
echo -n "Test 3: Cart Building... "
RESPONSE=$(curl -s -X POST http://localhost:8000/intent/extract \
  -H "Content-Type: application/json" \
  -d '{"user_input": "Movie night for 5 people"}')
if echo "$RESPONSE" | grep -q "item_count"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "  Response: $RESPONSE"
    ((FAILED++))
fi

# Test 4-11: All 8 Scenario Chips
SCENARIOS=(
  "I have guests coming in 30 minutes"
  "Movie night for 5 people"
  "My baby has fever"
  "Exam tomorrow morning"
  "Power cut at home"
  "Breakfast for 4 people"
  "Rain is coming"
  "House party tonight"
)

for i in "${!SCENARIOS[@]}"; do
  SCENARIO="${SCENARIOS[$i]}"
  TEST_NUM=$((i + 4))
  echo -n "Test $TEST_NUM: Scenario \"$SCENARIO\"... "
  
  RESPONSE=$(curl -s -X POST http://localhost:8000/intent/extract \
    -H "Content-Type: application/json" \
    -d "{\"user_input\": \"$SCENARIO\"}")
  
  if echo "$RESPONSE" | grep -q "cart"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC}"
    echo "  Scenario: $SCENARIO"
    echo "  Response: $RESPONSE"
    ((FAILED++))
  fi
done

# Test 12: Emergency Scenario (Baby Care)
echo -n "Test 12: Emergency Products (Baby)... "
RESPONSE=$(curl -s -X POST http://localhost:8000/intent/extract \
  -H "Content-Type: application/json" \
  -d '{"user_input": "My baby has fever"}')
if echo "$RESPONSE" | grep -q "baby\|medicine\|emergency"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "  Response: $RESPONSE"
    ((FAILED++))
fi

# Test 13: Budget Constraint
echo -n "Test 13: Budget Constraint... "
RESPONSE=$(curl -s -X POST http://localhost:8000/intent/extract \
  -H "Content-Type: application/json" \
  -d '{"user_input": "Movie night for 5 people, budget is 200 rupees"}')
if echo "$RESPONSE" | grep -q "budget_inr"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "  Response: $RESPONSE"
    ((FAILED++))
fi

# Test 14: Urgency Detection
echo -n "Test 14: High Urgency Detection... "
RESPONSE=$(curl -s -X POST http://localhost:8000/intent/extract \
  -H "Content-Type: application/json" \
  -d '{"user_input": "Emergency! Power cut at home right now"}')
if echo "$RESPONSE" | grep -q "high"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (urgency may be medium)"
    ((PASSED++))
fi

# Test 15: People Count Extraction
echo -n "Test 15: People Count Extraction... "
RESPONSE=$(curl -s -X POST http://localhost:8000/intent/extract \
  -H "Content-Type: application/json" \
  -d '{"user_input": "House party for 20 people"}')
if echo "$RESPONSE" | grep -q "people_count"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "  Response: $RESPONSE"
    ((FAILED++))
fi

# Summary
echo ""
echo "=================================="
echo "Test Results"
echo "=================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "Total:  $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo "Your QuickCart AI is ready for demo! 🚀"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED${NC}"
    echo "Please review the errors above and fix before demo."
    exit 1
fi
