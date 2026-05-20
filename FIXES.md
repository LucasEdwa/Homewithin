# Build & Bug Fixes — v1.0.1

## 6. Connect: Duplicate Matches Across Different Interests

**Symptom:** Two users who were already connected through one interest (e.g. "mentor") could still appear in each other's browse feed under a different interest (e.g. "first_friend"), allowing a second match row to be created for the same pair of users.

**Cause:** `findMatches()` in `services/matching.ts` built its exclusion set by only querying rows where the current user was the `requester_id`. It did not query the reverse direction — rows where the current user was the `target_id`. This meant:

- User A connects to User B → row `(A_requester, B_target)` created → B excluded from A's feed ✓
- User B connects to User A → row `(B_requester, A_target)` created → A NOT excluded from B's feed ✗

Since the `matches` table unique constraint is `(requester_id, target_id)`, both rows are valid separately, resulting in two independent match records for the same pair.

**Resolution:** Added a second parallel query in `findMatches()` to also fetch rows where the current user is the `target_id`, and added those `requester_id` values to the exclusion set. Once any interaction exists between two users in either direction, neither will appear in the other's browse feed regardless of which interest is selected.

**File:** `services/matching.ts`

```ts
// Before — only one direction checked
const [{ data: myActions }, { data: blocked }] = await Promise.all([
  supabase.from("matches").select("target_id").eq("requester_id", uid),
  supabase.from("blocks").select("blocker_id, blocked_id").or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`),
]);
const exclude = new Set<string>([uid]);
(myActions ?? []).forEach((m) => exclude.add(m.target_id));

// After — both directions checked
const [{ data: myActions }, { data: theirActions }, { data: blocked }] = await Promise.all([
  supabase.from("matches").select("target_id").eq("requester_id", uid),
  supabase.from("matches").select("requester_id").eq("target_id", uid),
  supabase.from("blocks").select("blocker_id, blocked_id").or(`blocker_id.eq.${uid},blocked_id.eq.${uid}`),
]);
const exclude = new Set<string>([uid]);
(myActions ?? []).forEach((m) => exclude.add(m.target_id));
(theirActions ?? []).forEach((m) => exclude.add(m.requester_id));
```

## 1. iOS Build Failure: No Space Left on Device

**Error:** `Errno::ENOSPC - No space left on device - fcopyfile` during `pod install`

**Cause:** Disk was full (~989 MB free). CocoaPods could not copy React Native pod files during the archive build.

**Resolution:** Cleared the following directories to free ~14 GB:
- `~/Library/Developer/Xcode/iOS DeviceSupport` (device debug symbols, auto-regenerated on device connect)
- `~/Library/Caches/CocoaPods` (re-downloaded on next `pod install`)
- `~/Library/Developer/Xcode/DerivedData`
- `~/Library/Application Support/Code/CachedExtensionVSIXs`
- Browser and npm caches

---

## 2. Xcode Build Scripts Blocked by Sandbox

**Error:** `Sandbox: find(PID) deny(1) file-read-data /…/ios/Homewithin.xcworkspace`

**Cause:** Xcode 26+ enables user script sandboxing by default, which blocks CocoaPods build scripts (e.g., the Hermes configuration script) from using `find` to read project files.

**Resolution:** Added `ENABLE_USER_SCRIPT_SANDBOXING = 'NO'` to the `post_install` hook in `ios/Podfile` for all pod targets, and disabled it for the main app target via Xcode Build Settings.

```ruby
# ios/Podfile
post_install do |installer|
  react_native_post_install(...)
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'
    end
  end
end
```

---

## 3. Hermes Compilation Failure: Invalid Dynamic `import()` Expression

**Error:** `main.jsbundle:69043:57 Invalid expression encountered`

**Cause:** `@supabase/supabase-js` v2.106.0 uses a dynamic `import(/* webpackIgnore: true */ '@opentelemetry/api')` expression to optionally load OpenTelemetry tracing. Hermes (React Native's JS engine) cannot compile dynamic `import()` expressions — it only supports CommonJS `require()`.

**Affected files in the package:**
- `node_modules/@supabase/supabase-js/dist/index.cjs` (line 67)
- `node_modules/@supabase/supabase-js/dist/index.mjs` (line 71)

**Resolution:** Replaced the dynamic import with `Promise.resolve(null)` since `@opentelemetry/api` is not installed and tracing is not used. The patch is managed via `patch-package` and re-applied automatically on `npm install`.

```js
// Before
if (otelModulePromise === null) otelModulePromise = import(
  /* webpackIgnore: true */
  /* @vite-ignore */
  OTEL_PKG
).catch(() => null);

// After
if (otelModulePromise === null) otelModulePromise = Promise.resolve(null);
```

Patch file: `patches/@supabase+supabase-js+2.106.0.patch`

---

## 4. React Version Mismatch Crash on App Start

**Error:** `Incompatible React versions: react is 19.2.6, react-native-renderer is 19.1.0`

**Cause:** `react` and `react-dom` were manually set to `19.2.6` in `package.json`, but `react-native` 0.81.5 ships with `react-native-renderer` built against React `19.1.0`. React requires these to be the exact same version.

**Resolution:** Downgraded `react` and `react-dom` to `19.1.0` to match what `react-native` 0.81.5 expects.

```bash
npm install react@19.1.0 react-dom@19.1.0 --save-exact
```

---

## 5. Journal Edit Creates New Entry Instead of Updating

**Error:** Tapping an existing journal entry to edit it and saving produced a duplicate entry rather than updating the original.

**Cause:** The screen uses `id` from `useLocalSearchParams` to determine whether a save is an insert or update. When opening an entry from the in-screen list (`openEntry()`), the URL param `id` remained `undefined` — it was never updated. So `handleSave()` always fell through to `id ?? uuid()`, generating a new UUID instead of reusing the existing entry's ID.

**Resolution:** Added an `editingId` state variable that is explicitly set when opening an entry from the list, cleared when starting a new entry, and cleared after saving.

**File:** `app/journal-entry.tsx`

```ts
// Added state
const [editingId, setEditingId] = useState<string | undefined>(id);

// openEntry now sets editingId
function openEntry(entryId: string) {
  ...
  setEditingId(entryId);
}

// startNewEntry clears editingId
function startNewEntry() {
  ...
  setEditingId(undefined);
}

// handleSave uses editingId instead of URL param id
const existing = editingId ? entries.find((e) => e.id === editingId) : undefined;
const entry: JournalEntry = {
  id: editingId ?? uuid(),
  date: existing?.date ?? todayISO(),
  createdAt: existing?.createdAt ?? new Date().toISOString(),
  ...
};
```
