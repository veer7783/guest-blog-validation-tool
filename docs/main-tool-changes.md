# Main Tool - No Changes Required

The main tool's `/check-prices` endpoint already compares against `base_price`, which is correct.

## Current Logic (Already Correct)

The validation tool uploads sites with a price column. The logic is:

1. **If site doesn't exist** → CREATE (proceed)
2. **If site exists and new price < existing base_price** → UPDATE (proceed)
3. **If site exists and new price >= existing base_price** → SKIP

This ensures only sites with LOWER prices than the current `base_price` are processed.
