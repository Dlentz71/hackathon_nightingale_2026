# Test Failure Analysis & Fix Plan

## Summary
**Total Failures**: 21 tests  
**Categories**: 3 main issues

---

## Issue 1: Capacity Calculation Logic (14 failures)

### Root Cause
The `QUARTER_WEEKS` constant is set to **6 weeks** instead of **13 weeks**.

**Current**: `QUARTER_WEEKS = 6` (in `app/src/lib/constants.ts`)  
**Expected**: `QUARTER_WEEKS = 13` (as per test expectations)

### Impact
All capacity calculations are wrong:
- `getMemberCapacity()` returns 240 hours (40 × 6) instead of 520 hours (40 × 13)
- All utilization ratios are off by a factor of ~2.17x
- Team capacity summaries show incorrect totals

### Failed Tests
1. ❌ `getMemberCapacity > calculates quarterly capacity (hoursPerWeek × 13)`
2. ❌ `getMemberCapacity > handles part-time members`
3. ❌ `getMemberUtilization > returns correct ratio for full utilization`
4. ❌ `getMemberUtilization > returns ratio < 1 for under-utilization`
5. ❌ `getMemberUtilization > can return ratio > 1 for over-allocation`
6. ❌ `getMemberUtilization > only counts assignments belonging to the given member`
7. ❌ `getMemberUtilization > sums hours across multiple assignments`
8. ❌ `getProjectedUtilization > includes existing assignments plus additional hours`
9. ❌ `getProjectedUtilization > correctly flags over-allocation projection`
10. ❌ `getProjectedUtilization > returns projected ratio with no existing assignments`
11. ❌ `getTeamCapacitySummary > sums capacity across all members`
12. ❌ `getTeamCapacitySummary > does not count members at exactly 110%`
13. ❌ `teamRules > getMemberUtilization > calculates correct ratio`
14. ❌ `teamRules > getMemberUtilization > only counts assignments for the given member`

### Fix Plan
```typescript
// In app/src/lib/constants.ts
export const QUARTER_WEEKS = 13  // Change from 6 to 13
```

### Verification
After fix, all 14 capacity-related tests should pass.

---

## Issue 2: Sidebar Navigation - Wrong Element Type (7 failures)

### Root Cause
The sidebar uses `<button>` elements instead of `<a>` (link) elements. Tests are looking for `role="link"` but finding `role="button"`.

**Current Implementation**: 
```tsx
<button onClick={() => onNavigate(item.id)} aria-current={isActive ? 'page' : undefined}>
```

**Test Expectation**: 
```tsx
screen.getByRole('link', { name: /dashboard/i })
```

### Impact
- Tests cannot find navigation links
- Semantic HTML is incorrect (buttons should be links for navigation)
- Accessibility issue: screen readers expect links for navigation

### Failed Tests
1. ❌ `App Shell > highlights active nav item with aria-current`
2. ❌ `App Shell > navigates to Projects view when clicking Projects nav item`
3. ❌ `App Shell > navigates to Team view when clicking Team nav item`
4. ❌ `App Shell > navigates to Capacity view when clicking Capacity nav item`
5. ❌ `App Shell > updates header title to match active view`
6. ❌ `App Shell > allows keyboard navigation through sidebar links`
7. ❌ `App Shell > shows User Switcher in header` (indirect - test setup fails)

### Fix Plan

**Option A: Update Tests** (Quick fix, but semantically incorrect)
```typescript
// Change all instances of:
screen.getByRole('link', { name: /dashboard/i })
// To:
screen.getByRole('button', { name: /dashboard/i })
```

**Option B: Update Sidebar Component** (Recommended - better semantics)
```tsx
// In app/src/components/layout/Sidebar.tsx
<a
  href="#"
  onClick={(e) => {
    e.preventDefault()
    onNavigate(item.id)
  }}
  role="link"
  aria-current={isActive ? 'page' : undefined}
  className={...}
>
  {item.icon}
  {item.label}
</a>
```

**Recommendation**: Use Option B for better accessibility and semantic HTML.

---

## Issue 3: User Switcher Not Rendering (1 failure)

### Root Cause
The `UserSwitcher` component is not rendering the user name "Gunter" in the test environment. This could be due to:
1. Seed data not loading properly in tests
2. Auth store not initialized
3. Component conditional rendering

### Failed Test
1. ❌ `App Shell > shows User Switcher in header`

### Investigation Needed
```typescript
// Check if hydrateSeedData() is being called in App.test.tsx
// Check if useAuthStore has the current user set
```

### Fix Plan
1. Ensure `hydrateSeedData()` is called in `App.test.tsx` beforeEach
2. Verify auth store is properly initialized with admin user
3. Update test to check for the UserSwitcher component presence rather than specific text

---

## Priority Fix Order

### 🔴 High Priority (Immediate)
1. **Fix QUARTER_WEEKS constant** - Affects 14 tests and core business logic
   - File: `app/src/lib/constants.ts`
   - Change: `QUARTER_WEEKS = 6` → `QUARTER_WEEKS = 13`
   - Impact: Fixes all capacity calculations

### 🟡 Medium Priority (Important for semantics)
2. **Fix Sidebar navigation elements** - Affects 7 tests and accessibility
   - File: `app/src/components/layout/Sidebar.tsx`
   - Change: Replace `<button>` with `<a>` elements
   - Impact: Better accessibility and semantic HTML

### 🟢 Low Priority (Minor)
3. **Fix UserSwitcher test** - Affects 1 test
   - File: `app/src/App.test.tsx`
   - Change: Add proper seed data initialization or adjust test expectations
   - Impact: Test coverage completeness

---

## Expected Results After Fixes

### Before Fixes
- ❌ 21 tests failing
- ✅ 56 tests passing
- **Success Rate**: 72.7%

### After All Fixes
- ✅ 77 tests passing
- ❌ 0 tests failing
- **Success Rate**: 100%

---

## Implementation Steps

1. **Step 1**: Update `QUARTER_WEEKS` constant
   ```bash
   # Edit app/src/lib/constants.ts
   # Run tests to verify: npm test
   ```

2. **Step 2**: Update Sidebar component to use links
   ```bash
   # Edit app/src/components/layout/Sidebar.tsx
   # Run tests to verify: npm test
   ```

3. **Step 3**: Fix UserSwitcher test
   ```bash
   # Edit app/src/App.test.tsx
   # Add hydrateSeedData() call if missing
   # Run tests to verify: npm test
   ```

4. **Step 4**: Verify all tests pass
   ```bash
   npm test
   ```
