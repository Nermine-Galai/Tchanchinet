# Tchanchinet

A Tunisian riddle game ("تشنشينة") for the browser, built with plain HTML, CSS and
JavaScript. The interface is in Arabic (right-to-left). Players answer riddles
from a bank of 40 in two modes: **solo** against the clock, or **two players** on
the same device.

Mini web project, FIA3, ISSAT Sousse, academic year 2025/2026.

## Game modes and rules

| | Solo | Two players (VS) |
| --- | --- | --- |
| Goal | Score as many points as possible | Score more points than the other player |
| Timer | Yes, the game ends when time runs out | No timer |
| Questions | Random, until time or questions run out | 5 per player, alternating P1, P2, P1... |
| Results | Final score | Both scores, winner or draw |

Rules shared by both modes:

- Each question gives **3 attempts**. Empty answers do not use an attempt.
- A correct answer earns **10 points**.
- After 2 wrong answers the **hint** (khamsa) unlocks. Revealing it costs **2 points**.
- After 3 wrong answers the correct answer is shown.
- **Skip** moves on without points.
- Answers are compared after normalising Arabic spelling (diacritics, أ/إ/آ → ا,
  ة → ه, extra spaces), so small spelling variants are accepted.

## Run the project

No install or build step. The riddles are loaded with `fetch`, so the project must
be served over HTTP (opening the files with `file://` will fail to load them).

1. Open the folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

## Project structure

```text
Tchanchinet/
├── index.html                 Rules and mode selection
├── quiz.html / quiz.js        Solo quiz
├── results.html / results.js  Solo result
├── versus.html                Enter both player names
├── versus-quiz.html / .js     Two-player quiz
├── versus-results.html / .js  Two-player result
├── styles.css                 Shared styles, layout and player colours
├── quiz-shared.css            Quiz controls and states (both quiz pages)
├── index.css, quiz.css, results.css,
│   versus.css, versus-quiz.css, versus-results.css   Page-specific styles
├── assests/                   Artwork (original files and optimised WebP)
└── tchanchinet/
    └── tunisian_riddles_40.json   The 40 riddles
```

Page flow:

```text
index.html → quiz.html?mode=solo → results.html
index.html → versus.html → versus-quiz.html → versus-results.html
```

## How it works

**Riddles.** `tchanchinet/tunisian_riddles_40.json` is a list of objects with three
strings: `question`, `hint` and `answer`. To add a riddle, add an object to the file.

**Game state in `data-*` attributes.** The JavaScript does not change styles. It
sets attributes on the `#quiz` element and the CSS reacts to them:

| Attribute | Values | Effect |
| --- | --- | --- |
| `data-attempts-left` | `3`, `2`, `1`, `0` | Chechias turn gray, khamsa opens |
| `data-status` | `ready`, `wrong`, `correct`, `exhausted` | Matching feedback message |
| `data-hint-state` | `hidden`, `revealed` | Shows the hint |
| `data-player` (VS) | `1`, `2` | Highlights the active player |

**Passing data between pages.** Player names travel in the URL
(`versus-quiz.html?mode=versus&player1=...&player2=...`) and are validated again in
JavaScript. Scores are saved in `sessionStorage` at the end of a game and read by
the results page. A results page opened without a finished game redirects to
the matching start page.

**Results.** `versus-results.js` compares the scores and sets `data-winner` on
`#versus-result` to `1`, `2` or `draw`; the CSS shows the matching message.

## Accessibility and responsive design

- `lang="ar"` and `dir="rtl"` on every page, labelled inputs, screen-reader
  feedback (`role="status"`, `aria-live`), keyboard focus styles.
- Active player and remaining attempts are exposed through `aria-current` and
  `aria-label`.
- Reduced-motion support, and layouts for phone and tablet (600 to 1100 px).

## Tuning the game

Scoring and length are constants at the top of the scripts:

- `quiz.js`: solo points, hint penalty and duration.
- `versus-quiz.js`: `POINTS_PER_QUESTION`, `HINT_PENALTY`, `MAX_ATTEMPTS`,
  `QUESTIONS_PER_PLAYER`.

## Testing checklist

- Correct, wrong and empty answers; third failure; Skip and Next.
- Hint unlocks only after two failures and resets on each question.
- Click and Enter both work; repeated clicks cannot award points twice.
- Solo ends when time runs out; VS alternates turns with no timer.
- Winner and draw screens; refreshing or opening results directly.
- Keyboard-only use, long Arabic text, phone layout.

## Known limitations

- Both VS players share one device.
- The artwork folder is spelled `assests` (kept as is, since the pages reference it).

