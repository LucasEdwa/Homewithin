# Bug: Hidden journal entry shows plain text after editing

## Symptom

After opening a PIN-protected journal entry, editing it, and saving, the entry card
in the list momentarily displayed the plain body text instead of the
`🔒 Hidden — tap to unlock` placeholder. The entry only re-locked visually after
navigating away and back to the screen.

## Root cause

`handleSave` called `await loadEntries()` to refresh the list, then called
`setUnlockedIds(...)` to remove the entry's ID afterward:

```ts
// Before fix
await loadEntries();     // internally: await getJournalEntries() → setEntries(all)
setLoading(false);
setUnlockedIds(prev => { /* remove entry id */ });
setShowList(true);
```

`loadEntries` contains its own `await` (`await getJournalEntries()`), which creates
an additional microtask boundary. React resolved `setEntries(all)` inside that
boundary and flushed a render **before** `setUnlockedIds` had run. At that render,
`unlockedIds` still contained the entry's ID, so `isLocked` evaluated to `false`
and the body text was shown.

The entry was only hidden again on the next navigation because remounting the screen
resets `unlockedIds` to an empty `Set`.

## Fix

Replaced `await loadEntries()` with an inline `await getJournalEntries()` so that
`setEntries`, `setUnlockedIds`, `setShowList`, and all related state updates sit in
a single synchronous block after one `await`. React 18 batches all `setState` calls
in the same synchronous execution into a single render, so the list never renders
with a stale `unlockedIds`.

```ts
// After fix
const all = await getJournalEntries();   // single await
setEntries(all);
setLoading(false);
if (entry.isHidden) {
  setUnlockedIds(prev => { const next = new Set(prev); next.delete(entry.id); return next; });
}
setShowList(true);
// ... remaining resets
```

## Files changed

- `app/(wellness)/journal-entry.tsx` — `handleSave` function
