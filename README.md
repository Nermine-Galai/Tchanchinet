# Tchanchinet

A Tunisian riddle game ("تشنشينة") for the browser, built with plain HTML, CSS and
JavaScript, with a PHP and MySQL part for the questions. The interface is in
Arabic (right-to-left). Players answer riddles from a bank of 70 in two modes:
**solo** against the clock, or **two players** on the same device.

The project has three parts, all done:

- the HTML, CSS and JavaScript game;
- the PHP part for the `questions` table (riddles stored in MySQL, answers
  checked and scored on the server);
- the PHP part for the `scores` table (scores saved in MySQL at the end of each
  game, and the five best shown on the results pages).

Mini web project, FIA3, ISSAT Sousse, academic year 2026/2027.
By Nermine Galai and Sarra Gharbi. The full report is in [rapport.pdf](rapport.pdf).

The JavaScript part follows **sujet 7, "Page de quiz interactif"**:

| Requirement | Where it is done |
| --- | --- |
| Countdown timer per question | Solo 3-minute countdown in `js/quiz.js`, plus a hidden clock per question kept by PHP in the session |
| Dynamic score with time penalties | `php/verifier_reponse.php` calculates the points and the penalty; `checkAnswer` in `js/quiz-shared.js` displays them |
| Immediate feedback after each answer | `data-status` on `#quiz`, styled in `css/quiz-shared.css` |
| Best scores saved | First done with `localStorage`; now saved in the MySQL `scores` table (see the PHP part) |
| Bonus: replay with full reset | `startGame` in `js/quiz.js` and `js/versus-quiz.js` |
| Bonus: different question types | Text and QCM riddles in the `questions` table |
| Bonus: visual progress bar | `updateProgress` in `js/quiz-shared.js` |
| Bonus: transition between questions | `js/quiz-transition.js` |

Plain ("vanilla") JavaScript only, no libraries.

The PHP part of sujet 7 is split by database table: the **questions** table
and the **scores** table.

| PHP requirement | Where it is done |
| --- | --- |
| Questions and answers stored in the database | `php/installer_questions.php` creates and fills the `questions` table; phpMyAdmin is used to add, modify or delete a question |
| Answers checked and scored on the server | `php/verifier_reponse.php`, with `php/commencer_question.php` and `php/ouvrir_indice.php` |
| Scores saved and ranked in the database | `php/installer_scores.php` creates the `scores` table; `php/save_score.php` saves a score; `php/get_scores.php` returns the five best of a mode |
| JavaScript ↔ PHP communication | `fetch` in `js/quiz-shared.js` calls `get_questions.php`, `commencer_question.php`, `ouvrir_indice.php` and `verifier_reponse.php`; `fetch` in `js/quiz.js`, `js/versus-quiz.js` and `js/scores.js` calls `save_score.php` and `get_scores.php` |

Native PHP only, no framework. The comments in the PHP files are in English;
the variable names and the JSON keys sent to JavaScript are in French
(`reponse`, `essais`, `indice`, `bonne_reponse`).

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
- Text riddles list accepted spellings in the `answer` column; QCM riddles use a
  single answer matching one of their `options`.
  Comparison ignores leading, trailing and repeated whitespace.

## Run the project

The riddles are now read from MySQL by PHP, so Live Server is not enough: the
project needs a PHP server and MySQL (XAMPP for example).

1. Start **MySQL** from the XAMPP control panel.
2. In phpMyAdmin, create an empty database named `tchanchinet`.
3. Open a terminal in the project folder and start PHP:
   `C:\xampp\php\php.exe -S localhost:8000`
   (or copy the folder into `C:\xampp\htdocs` and start Apache).
4. Open `http://localhost:8000/php/installer_questions.php` **once**: it creates
   the `questions` table and fills it with the 70 riddles.
5. Open `http://localhost:8000/php/installer_scores.php` **once**: it creates the
   empty `scores` table.
6. Play at `http://localhost:8000/index.html`.
7. To add, modify or delete a question, open the `questions` table in phpMyAdmin.

The database name, user and password are in `php/connexion.php` (`root` with an
empty password, the XAMPP default).

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
│   ├── scores.js               Loads and displays both leaderboards
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
├── php/                       Server side (questions and scores tables)
│   ├── connexion.php           PDO connection to the `tchanchinet` database
│   ├── installer_questions.php Creates and fills the `questions` table (run once)
│   ├── get_questions.php       Sends the questions to JavaScript as JSON, without answers
│   ├── commencer_question.php  Notes in the session which question starts and when
│   ├── ouvrir_indice.php       Notes in the session that the hint was opened
│   ├── verifier_reponse.php    Checks one answer, calculates the points, sends back the correction
│   ├── installer_scores.php    Creates the `scores` table (run once)
│   ├── save_score.php          Saves one score at the end of a game
│   └── get_scores.php          Sends the five best scores of a mode as JSON
├── assets/                   Artwork and riddle data
│   ├── *.png, *.jpg, *.webp    Original artwork and optimised WebP images
│   └── tunisian_riddles_40.json   The 70 riddles of the JavaScript version (now copied into the database)
└── rapport.pdf                Project report (French)
```

Page flow:

```text
index.html → pages/quiz.html?mode=solo → pages/results.html
index.html → pages/versus.html → pages/versus-quiz.html → pages/versus-results.html
```

## How it works

**Riddles.** The `questions` table contains 40 riddles with `type` `text` and 30
with `type` `qcm`. Its columns are `id`, `type`, `question`, `hint`, `answer`
and `options`. For a text riddle, `answer` holds the accepted spellings separated
by `|` and `options` is empty; for a QCM, `options` holds the four choices
separated by `|` and `answer` is one of them. PHP cuts these cells with
`explode`. After three wrong attempts, the first text answer or the QCM answer
is displayed.

**Loading the questions (JS → PHP).** `loadQuestions` calls
`php/get_questions.php`, which reads the table with PDO and answers with
`json_encode`. The answers are not sent, so they cannot be read in the browser.

**Checking and scoring on the server (JS → PHP → JS).** The scoring is done by
PHP only, with a session (`$_SESSION`):

- When a question appears, `showQuestion` calls `php/commencer_question.php`,
  which stores the question id, the start time (`time()`), zero attempts and no
  hint in the session.
- When the player opens the hint, `revealHint` calls `php/ouvrir_indice.php`,
  which stores it in the session (only after two wrong answers).
- `checkAnswer` sends only the question `id` and the typed answer (`reponse`) to
  `php/verifier_reponse.php`. PHP counts the attempt, compares the answer with
  the accepted spellings, and sends back `correct`, the final `points` and
  `bonne_reponse`, which is filled only when the question is finished.

JavaScript only adds the points it receives to the score on screen. The browser
never sends the attempt number, the hint or the time, so they cannot be changed
from the browser.
Text riddles use the input bar; QCM riddles use four buttons styled like that bar.

**Relative paths.** `index.html` links to `pages/` and loads styles from `css/`.
Pages in `pages/` load styles from `../css/`, scripts from `../js/`, and images
from `../assets/`; their home links point to `../index.html`. CSS image URLs
resolve relative to the stylesheet in `css/`, so they also use `../assets/`.
The shared quiz script fetches `../php/get_questions.php` relative to the
quiz page. Links between game pages use the filename because they share `pages/`.

**Shared code.** `js/quiz-shared.js` handles question loading, text and QCM
answers, attempts, hints, scoring, penalties, progress colors and controls.
`js/quiz.js` handles the solo countdown; `js/versus-quiz.js` handles player names
and turns. `js/scores.js` loads and displays both leaderboards. Each function
has a short comment explaining its purpose.
The bonus sections use plain `for` loops, named click handlers and `if/else`
blocks for the QCM choices, replay and progress colors.

**Hidden clock per question.** Besides the visible solo countdown, every
question has its own clock that is never displayed, and it lives on the server.
`php/commencer_question.php` stores `$_SESSION['debut'] = time()` each time a
question appears, so every riddle starts again from zero. When the answer is
correct, `php/verifier_reponse.php` takes the seconds elapsed since
`$_SESSION['debut']`, removes 5 points per full 10 seconds and caps the penalty
at 25; the points never go below zero. For example, a correct second
attempt after 23 seconds gives 80 − 10 = 70 points. Both quiz modes call the
same PHP files, so it also applies in VS mode, where no countdown is shown.

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

**Best scores (JS → PHP → MySQL).** The `scores` table has the columns `id`,
`game_mode` (`solo` or `versus`), `player_name` (empty in solo mode), `score`
and `created_at` (filled by MySQL when the row is saved).

- **Saving.** At the end of a game, `finishGame` sends the score to
  `php/save_score.php` with a POST `fetch` in JSON: once in solo mode
  (`mode`, `score`), and once per player in two-player mode (`mode`, `name`,
  `score`). It waits for the answer before opening the results page. PHP checks
  the values and inserts the row with a prepared query.
- **Ranking.** On the results pages, `renderLeaderboard` in `js/scores.js` calls
  `php/get_scores.php?mode=solo` or `?mode=versus`. PHP returns the five highest
  scores of that mode, with the date and the player name; when two scores are
  equal, the older one comes first.

The scores were first kept in `localStorage` (JavaScript part); they are now
only in the database, so the leaderboards are the same in every browser.
Restart keeps the leaderboards.

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

## Lighthouse scores

Measured with Lighthouse while the site ran on Live Server, on the JavaScript
version of the project (before the PHP part was added):

| Page | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| `index.html` | 94 | 100 | 100 | 100 |
| `pages/quiz.html?mode=solo` | 95 | 100 | 100 | 100 |
| `pages/results.html` | 96 | 100 | 100 | 100 |
| `pages/versus.html` | 97 | 100 | 100 | 100 |
| `pages/versus-quiz.html` | 95 | 100 | 100 | 100 |

## Tuning the game

Scoring and length are constants at the top of the scripts:

- [php/verifier_reponse.php](php/verifier_reponse.php): `$points_par_essai`, the
  25 points given with the hint, and the time penalty (5 points per 10 seconds,
  25 at most).
- [js/quiz-shared.js](js/quiz-shared.js): `MAX_ATTEMPTS` (for the chechias on screen).
- [js/quiz.js](js/quiz.js): `TOTAL_TIME`.
- [js/versus-quiz.js](js/versus-quiz.js): `QUESTIONS_PER_PLAYER`.

## Testing checklist

- From `index.html`, open both modes and confirm the styles, images and riddles load.
- Confirm home links and direct-result redirects reach the correct pages.
- Correct, wrong and empty answers; third failure; Skip and Next.
- Hint unlocks only after two failures and resets on each question.
- Click and Enter both work; repeated clicks cannot award points twice.
- Solo ends when time runs out; VS alternates turns with no timer.
- A slow correct answer loses 5 points per 10 seconds (25 at most), and the
  penalty starts again from zero on the next question.
- QCM: one choice, correct option in green and wrong choice in red.
- The progress bar turns yellow, then red; the slide is skipped with reduced motion.
- Restart resets the score, timer, bar and questions but keeps the best scores.
- Best scores survive a browser restart, and each leaderboard shows only the
  top five of its mode.
- Winner and draw screens; refreshing or opening results directly.
- Keyboard-only use, long Arabic text, phone layout.
- PHP: `php/get_questions.php` opened in the browser shows 70 questions and no
  `answer` field.
- PHP: in the browser's Network tab, each answer calls `verifier_reponse.php`,
  and its response has `correct`, `points` and `bonne_reponse` (empty until the
  question is finished).
- PHP: with MySQL stopped, the quiz shows an error message instead of a question.
- PHP: at the end of a game the Network tab shows `save_score.php` (twice in
  two-player mode), and a new row appears in the `scores` table.
- PHP: `php/get_scores.php?mode=solo` and `?mode=versus` return at most five
  scores, highest first, and the results pages show the same list.

## Known limitations

- Both VS players share one device.
- The final score is sent by the browser, and `save_score.php` only checks that
  it is a positive number; each answer is scored on the server, but the total
  is not.
- Solo scores are saved without a player name.
- Questions are added, modified or deleted in phpMyAdmin; there is no
  management page.
- The PHP server remembers one question at a time for each browser (PHP
  session), so the game should be played in one tab at a time.

