# scripts/seed-programs.ts

Populates the `programs` and `lessons` tables in Supabase with the content defined in [`data/programs.ts`](../data/programs.ts).

## When to run

Run this **once** after applying the `20260524000000_programs_and_lessons` migration to a fresh or reset database. It is safe to re-run — every upsert uses `ON CONFLICT DO UPDATE`, so existing rows are updated rather than duplicated.

## Prerequisites

The script needs a Supabase **service role key** (not the anon key) to bypass Row Level Security. Set the following environment variables before running:

| Variable                    | Description                                       |
| --------------------------- | ------------------------------------------------- |
| `SUPABASE_URL`              | Your project URL (e.g. `https://xyz.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role secret from the Supabase dashboard   |

`EXPO_PUBLIC_SUPABASE_URL` is accepted as a fallback for the URL, so a standard `.env` file from local Expo development usually has everything the script needs.

### Loading credentials

The script automatically reads a `.env` file from the project root (no extra packages required). Existing shell environment variables are not overwritten, so CI secrets passed via the environment take precedence.

## Usage

```bash
# From the project root
npm run seed:programs
```

This runs `npx tsx scripts/seed-programs.ts` using the TypeScript execution engine bundled with the project.

## TypeScript notes

The file begins with `/// <reference types="node" />` because the project's root `tsconfig.json` sets `"types": ["jest"]` (limiting auto-included type packages to avoid polluting app code). The triple-slash directive opts this script into `@types/node` so that `fs`, `path`, and `process` are all correctly typed without changing the global tsconfig.
