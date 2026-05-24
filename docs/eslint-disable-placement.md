# ESLint Disable Comment Placement

## `react-hooks/exhaustive-deps` in hooks with deps arrays

The `react-hooks/exhaustive-deps` rule reports its warning on the **line containing the dependency array** (`}, [deps]);`), not on the line where the hook is called.

Therefore, `// eslint-disable-next-line` must be placed **immediately before the closing line of the hook**, not before the hook call itself.

### Correct

```ts
useEffect(() => {
  doSomething();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

### Incorrect (generates an "Unused eslint-disable directive" warning)

```ts
// eslint-disable-next-line react-hooks/exhaustive-deps  ← wrong position
useEffect(() => {
  doSomething();
}, []);
```

## When is a disable comment justified?

Only suppress the rule when adding the missing dependency would cause an **infinite loop or unintended re-runs**. Common cases in this codebase:

- **Mount-only effects** — intentionally run once on mount with `[], []`.
- **Animation effects** — `Animated.Value` refs are stable but not listed as deps.
- **`useFocusEffect` mocks in tests** — the `cb` callback param changes identity on every render, so adding it would loop; the empty array is intentional.
- **`useCallback` inside `useFocusEffect`** — `refreshMatchLists` is stable but not memoised at the call site; the enclosing callback should not re-run when it changes.

## `react-hooks/exhaustive-deps` inside `jest.mock` factories

Inside `jest.mock(() => ({ ... }))` factory functions the React import is the **top-level module import**, not a runtime `require`. Never use `const React = require('react')` inside a mock factory — it triggers `@typescript-eslint/no-require-imports`.

The `useFocusEffect` mock pattern used throughout `__tests__/screens/` is:

```ts
jest.mock("expo-router", () => ({
  useFocusEffect: (cb: () => void) => {
    React.useEffect(() => {
      const cleanup = cb();
      return cleanup ?? undefined;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  },
}));
```

## `varsIgnorePattern` and the `_` prefix

`eslint-config-expo/flat` does **not** configure `varsIgnorePattern` to ignore variables prefixed with `_`. Prefixing an unused variable with `_` (e.g. `const _foo = ...`) does **not** suppress the `no-unused-vars` warning — the variable must be removed entirely.
