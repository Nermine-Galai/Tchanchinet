# Tchanchinet

A Tunisian riddle game ("تشنشينة") for the browser, built with plain HTML, CSS and
JavaScript. The interface is in Arabic (right-to-left). Players answer riddles
from a bank of 70 in two modes: **solo** against the clock, or **two players** on
the same device.

Mini web project, FIA3, ISSAT Sousse, academic year 2025/2026.

## Game modes and rules

| | Solo | Two players (VS) |
| --- | --- | --- |
| Goal | Score as many points as possible | Score more points than the other player |
| Timer | 3 minutes; the game ends when time runs out | No timer |
| Questions | Random, until time or questions run out | 5 per player, alternating P1, P2, P1... |
| Results | Final score | Both scores, winner or draw |

The solo countdown pauses while **Next** is enabled and during question slides.
It resumes when the next question is ready; the progress bar pauses with it.

Rules shared by both modes:

- Text riddles give **3 attempts**. Empty answers do not use an attempt.
- QCM riddles show four buttons in a 2×2 grid, with **one choice** and no hints
  or attempt icons. A correct choice starts at **100 points**; a wrong choice shows
  the correct answer. Use **Next** to continue.
- A correct text answer starts at **100 points** on the first attempt, **80** on the second,
  or **50** on the third without a hint.
- After 2 wrong answers the **hint** (khamsa) unlocks. Using it makes a correct
  third answer start at **25 points**.
- In both modes, a correct answer loses **5 points per full 10 seconds** spent
  on that question, capped at **25 points**. The clock starts with each new
  question and continues across retries. Points earned never go below zero.
- After 3 wrong answers the correct answer is shown.
- **Skip** moves on without points.
- **Next** and **Skip** slide the question and answers left, then bring the next
  ones in from the right (300 ms total). Reduced-motion mode skips the animation.
  The bonus code uses CSS keyframes and two `setTimeout` steps for this slide.
- The bar above the question fills with elapsed time in solo mode and completed
  questions (including skipped ones) in VS mode. Restart resets it.
  It turns yellow with one-third remaining, then red with one-sixth remaining
  (60 / 30 seconds in solo; 3 / 1 questions in VS).
- **Restart** (عاود من الأول) resets scores, attempts, hints and questions; solo
  also resets the timer, and VS starts again with player 1 and the same names.
- Text riddles list accepted spellings in an `answer` array; QCM riddles use a
  single `answer` string matching one of their `options`.
  Comparison ignores leading, trailing and repeated whitespace.

## Run the project

No install or build step. The riddles are loaded with `fetch`, so the project must
be served over HTTP (opening the files with `file://` will fail to load them).

1. Open the folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

Serve the project root so that `index.html`, `pages/`, `css/`, `js/` and `assets/`
are available together.

## Project structure

```text
Tchanchinet/
├── index.html                 Rules and mode selection
├── pages/                     Game pages
│   ├── quiz.html              Solo quiz
│   ├── results.html           Solo result
│   ├── versus.html            Enter both player names
│   ├── versus-quiz.html       Two-player quiz
│   └── versus-results.html    Two-player result
├── js/                        Quiz and result scripts
│   ├── quiz.js
│   ├── quiz-shared.js          Shared questions, answers, scoring and controls
│   ├── quiz-transition.js      Slide animation for both modes
│   ├── scores.js               Shared leaderboard saving and display
│   ├── results.js
│   ├── versus-quiz.js
│   └── versus-results.js
├── css/                       Stylesheets
│   ├── styles.css             Shared styles, layout and player colours
│   ├── quiz-shared.css        Quiz controls and states (both quiz pages)
│   ├── index.css              Home page
│   ├── quiz.css               Solo quiz
│   ├── results.css            Solo result
│   ├── versus.css             Player name form
│   ├── versus-quiz.css        Two-player quiz
│   └── versus-results.css     Two-player result
├── assets/                   Artwork and riddle data
│   ├── *.png, *.jpg, *.webp    Original artwork and optimised WebP images
│   └── tunisian_riddles_40.json   The 70 riddles (original filename retained)
└── tchanchinet/               Reference images
```

Page flow:

```text
index.html → pages/quiz.html?mode=solo → pages/results.html
index.html → pages/versus.html → pages/versus-quiz.html → pages/versus-results.html
```

## How it works

**Riddles.** [assets/tunisian_riddles_40.json](assets/tunisian_riddles_40.json)
contains 40 riddles with `type: "text"` and 30 with `type: "qcm"`. Each has
`question` and `hint` strings. Text riddles use an `answer` array of accepted
spellings; QCM riddles have four `options` and one `answer` string. After three
wrong attempts, the first text answer or the full QCM answer is displayed.
Text riddles use the input bar; QCM riddles use four buttons styled like that bar.

**Relative paths.** `index.html` links to `pages/` and loads styles from `css/`.
Pages in `pages/` load styles from `../css/`, scripts from `../js/`, and images
from `../assets/`; their home links point to `../index.html`. CSS image URLs
resolve relative to the stylesheet in `css/`, so they also use `../assets/`.
The shared quiz script fetches `../assets/tunisian_riddles_40.json` relative to the
quiz page. Links between game pages use the filename because they share `pages/`.

**Shared code.** `js/quiz-shared.js` handles question loading, text and QCM
answers, attempts, hints, scoring, penalties, progress colors and controls.
`js/quiz.js` handles the solo countdown; `js/versus-quiz.js` handles player names
and turns. `js/scores.js` saves and displays both leaderboards. Each function
has a short comment explaining its purpose.
The bonus sections use plain `for` loops, named click handlers and `if/else`
blocks for the QCM choices, replay and progress colors.

**Game state in `data-*` attributes.** The JavaScript does not change styles. It
sets attributes on the `#quiz` element and the CSS reacts to them:

| Attribute | Values | Effect |
| --- | --- | --- |
| `data-attempts-left` | `3`, `2`, `1`, `0` | Chechias turn gray, khamsa opens |
| `data-status` | `ready`, `wrong`, `correct`, `exhausted` | Matching feedback message |
| `data-hint-state` | `hidden`, `revealed` | Shows the hint |
| `data-player` (VS) | `1`, `2` | Highlights the active player |

**Passing data between pages.** Player names travel in the URL
(`pages/versus-quiz.html?mode=versus&player1=...&player2=...`) and are validated again in
JavaScript. Scores are saved in `sessionStorage` at the end of a game and read by
the results page. A results page opened without a finished game redirects to
`index.html` for solo mode or `pages/versus.html` for two-player mode.

**Best scores.** Each finished game saves its scores in `localStorage`:
`soloBestScores` or `versusBestScores`. Each list keeps the five highest scores,
with dates and VS player names. Restart keeps these leaderboards.

**Results.** `js/versus-results.js` compares the scores and sets `data-winner` on
`#versus-result` to `1`, `2` or `draw`; the CSS shows the matching message.

## Accessibility and responsive design

- `lang="ar"` and `dir="rtl"` on every page, labelled inputs, screen-reader
  feedback (`role="status"`, `aria-live`), keyboard focus styles.
- Active player and remaining attempts are exposed through `aria-current` and
  `aria-label`.
- QCM choices support **Tab / Shift+Tab** and the **arrow keys** in the RTL 2×2
  grid. **Enter / Space** submits the focused choice. An inset focus ring stays
  visible on phone screens, and focus moves to **Next** after an answer.
- Reduced-motion support, and layouts for phone and tablet (600 to 1100 px).

## Tuning the game

Scoring and length are constants at the top of the scripts:

- [js/quiz-shared.js](js/quiz-shared.js): `POINTS_BY_ATTEMPT`, `POINTS_WITH_HINT`,
  `MAX_ATTEMPTS`, `TIME_PENALTY_INTERVAL`, `TIME_PENALTY_POINTS`, `MAX_TIME_PENALTY`.
- [js/quiz.js](js/quiz.js): `TOTAL_TIME`.
- [js/versus-quiz.js](js/versus-quiz.js): `QUESTIONS_PER_PLAYER`.

## Testing checklist

- From `index.html`, open both modes and confirm the styles, images and riddles load.
- Confirm home links and direct-result redirects reach the correct pages.
- Correct, wrong and empty answers; third failure; Skip and Next.
- Hint unlocks only after two failures and resets on each question.
- Click and Enter both work; repeated clicks cannot award points twice.
- Solo ends when time runs out; VS alternates turns with no timer.
- Winner and draw screens; refreshing or opening results directly.
- Keyboard-only use, long Arabic text, phone layout.

## Known limitations

- Both VS players share one device.

