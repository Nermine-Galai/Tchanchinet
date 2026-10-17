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
| Timer | 3 minutes; the game ends when time runs out | No timer |
| Questions | Random, until time or questions run out | 5 per player, alternating P1, P2, P1... |
| Results | Final score | Both scores, winner or draw |

Rules shared by both modes:

- Each question gives **3 attempts**. Empty answers do not use an attempt.
- A correct answer earns **100 points** on the first attempt, **80** on the second,
  or **50** on the third without a hint.
- After 2 wrong answers the **hint** (khamsa) unlocks. Using it makes a correct
  third answer worth **25 points**.
- After 3 wrong answers the correct answer is shown.
- **Skip** moves on without points.
- Accepted spellings and synonyms are listed in each riddle's `answer` array.
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
│   └── tunisian_riddles_40.json   The 40 riddles
└── tchanchinet/               Reference images
```

Page flow:

```text
index.html → pages/quiz.html?mode=solo → pages/results.html
index.html → pages/versus.html → pages/versus-quiz.html → pages/versus-results.html
```

## How it works

**Riddles.** [assets/tunisian_riddles_40.json](assets/tunisian_riddles_40.json)
is a list of objects with `question` and `hint` strings and an `answer` array of
accepted strings. The first answer is displayed after three wrong attempts.
To add a riddle, add an object with the same fields to the file.

**Relative paths.** `index.html` links to `pages/` and loads styles from `css/`.
Pages in `pages/` load styles from `../css/`, scripts from `../js/`, and images
from `../assets/`; their home links point to `../index.html`. CSS image URLs
resolve relative to the stylesheet in `css/`, so they also use `../assets/`.
Both quiz scripts fetch `../assets/tunisian_riddles_40.json` relative to the
quiz page. Links between game pages use the filename because they share `pages/`.

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

**Results.** `js/versus-results.js` compares the scores and sets `data-winner` on
`#versus-result` to `1`, `2` or `draw`; the CSS shows the matching message.

## Accessibility and responsive design

- `lang="ar"` and `dir="rtl"` on every page, labelled inputs, screen-reader
  feedback (`role="status"`, `aria-live`), keyboard focus styles.
- Active player and remaining attempts are exposed through `aria-current` and
  `aria-label`.
- Reduced-motion support, and layouts for phone and tablet (600 to 1100 px).

## Tuning the game

Scoring and length are constants at the top of the scripts:

- [js/quiz.js](js/quiz.js): `POINTS_BY_ATTEMPT`, `POINTS_WITH_HINT`, `MAX_ATTEMPTS`, `TOTAL_TIME`.
- [js/versus-quiz.js](js/versus-quiz.js): `POINTS_BY_ATTEMPT`, `POINTS_WITH_HINT`, `MAX_ATTEMPTS`,
  `QUESTIONS_PER_PLAYER`.

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

