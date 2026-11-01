# Task 7-a — wordle-fa (حدس‌لغت)

## Deliverable
- Created exactly one file: `src/components/os/games/wordle-fa.tsx` (Persian Wordle, 5-letter answers, 6 tries).
- No other files modified. No packages installed. No servers started.

## Implementation notes
- `'use client'`, `export default function WordleGame()`, strict TS — `bunx tsc --noEmit` shows zero errors for this file; `bun run lint` shows zero problems for this file (the only lint error is pre-existing in `src/components/os/leaderboard.tsx:78`, untouched).
- Uses `GameShell` + `LiveBoard game="wordle"` + `useBestScore('wordle')` + `refreshKey` state per the contract; win increments `best`/`wins`, bumps `refreshKey`.
- Feedback algorithm handles duplicate letters (correct > present > absent pooling).
- Word list from spec, filtered at runtime to exactly-5-letter entries (`عسلی` is 4 letters and is safely excluded).
- On-screen Persian keyboard (ض…چ / ش…گ / ظ…و + non-functional dot + ثبت + Delete-icon backspace), physical keydown listener (Persian letters, Enter, Backspace; ignores meta/ctrl and input/textarea targets), staggered flip reveal via `transition-all duration-300` + per-column `transitionDelay` (120ms).
- Win overlay «آفرین!» / lose overlay «این یکی نشد!» via `Overlay` with lucide icons; no emojis anywhere.
- Fits 460×640: grid `h-11 w-11 sm:h-12 sm:w-12`, compact `gap-1` keyboard (h-10 keys), content wrapper uses `-mx-3 w-[calc(100%+1.5rem)]` so the 5-cell grid is not clipped beside the 192px LiveBoard.
- ARIA: `role="grid"/"row"/"gridcell"` with per-cell labels, keyboard group label, `role="status"` hint line.

## Icons imported from lucide-react
`SpellCheck`, `Delete`, `PartyPopper`, `XCircle`

## Handoff
- Game is self-contained; to register it in the OS app list, add an entry pointing to `@/components/os/games/wordle-fa` with leaderboard key `wordle` (integration likely belongs to a different task).
