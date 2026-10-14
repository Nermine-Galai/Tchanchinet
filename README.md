# Tchanchinet — HTML/CSS and JavaScript handoff

The work is split between two teammates: the HTML/CSS structure and design are
already built; the next part is connecting the game with JavaScript. The interface
is Arabic, with right-to-left text.

## What is already done (HTML/CSS)

- Home page with the rules and links to both modes.
- Solo quiz: question, typed answer, timer, score, three attempts and Skip.
- Name-entry page for two players, with required fields and a 24-character limit.
- VS quiz: blue for player 1, gold for player 2, separate scores and a turn label.
  Both players use the same device. **VS mode has no timer.**
- Solo and VS results layouts, including either winner and a draw.
- Red/gray chechias for attempts; closed/open khamsa for the hint.
- Visual feedback for correct answers, wrong answers and exhausted attempts.
- Responsive CSS, keyboard focus styles, labelled inputs, screen-reader feedback
  and reduced-motion support.

**The game logic is not implemented yet.** Links and the name form work, but
checking answers, showing entered names, counting attempts, revealing hints,
changing turns, timing and scoring still need JavaScript. The current questions,
time and scores in the HTML are placeholders.

## Files and page flow

Open `index.html` directly in a browser to preview the design. No installation is
needed for the HTML/CSS preview.

| File | Purpose |
| --- | --- |
| `index.html` | Rules and mode selection |
| `quiz.html` / `results.html` | Solo quiz and result |
| `versus.html` | Enter both names |
| `versus-quiz.html` / `versus-results.html` | VS quiz and results |
| `styles.css` | Shared background, logo, panels, buttons and player colors |
| `quiz-shared.css` | Quiz controls and states shared by solo and VS; only loaded by the quiz pages |
| `index.css` | Home styles |
| `quiz.css` / `results.css` | Solo score badge / solo result styles |
| `versus.css` / `versus-quiz.css` / `versus-results.css` | Styles specific to each VS page |
| `assests/` | Original artwork and optimized WebP files, beside the HTML/CSS files |
| `tchanchinet/tunisian_riddles_40.json` | Existing bank of 40 questions, hints and answers |

The folder is spelled **`assests`** here. Pages use optimized WebP images with a
content hash in each filename, such as `assests/tchanchinet_logo.c576f576c8.webp`.
Original PNG/JPG files remain available for future edits. Preserve transparency
when replacing artwork, and give changed optimized images a new filename so
browsers do not reuse an older cached version. Solo timer/score frames are CSS.

### HTTP preview and Lighthouse

This project contains HTML/CSS and image assets, with no custom server code.
For an HTTP preview, use VS Code's Live Server extension: right-click `index.html`
and choose **Open with Live Server**. Open the address it provides in Chrome,
then run Lighthouse from DevTools.

- Optimized WebP images reduce downloads while preserving the artwork.
- The home page does not download the quiz-only stylesheet. Important images
  have loading priority, and the background is preloaded from the HTML.
- CSS stays readable and separate from HTML, with declarations on separate lines.

Cache lifetimes and gzip compression are controlled by the preview server or
hosting service, not by HTML/CSS. Lighthouse may still report those warnings
when the preview server does not provide the corresponding HTTP headers.

```text
index.html -> quiz.html?mode=solo -> results.html
index.html -> versus.html -> versus-quiz.html -> versus-results.html
```

JavaScript must handle the transition from each quiz to its results page.

## What the JavaScript teammate needs to do

Suggested order: load questions, check answers, count attempts, connect the hint,
handle Next/Skip, add solo scoring/time, add VS turns/scores, then fill the results.

Keep JavaScript in separate `.js` files and load them with `defer`, for example
`<script src="quiz.js" defer></script>`. This is a suggested filename, not an
existing file. Shared code can serve both quizzes, but check the mode before
accessing solo-only elements such as the timer.

### 1. Questions, hints and answers

Review and use the existing `tchanchinet/tunisian_riddles_40.json`. Each entry has
three strings: `question`, `hint` and `answer`. You can edit or add entries there;
there is no need to write a separate HTML block for each question.

After loading the list and choosing the current question:

```js
document.querySelector("#question-text").textContent = currentQuestion.question;
document.querySelector("#hint-text").textContent = currentQuestion.hint;
document.querySelector("#correct-answer").textContent = currentQuestion.answer;
```

The CSS keeps the hint and correction hidden until the appropriate state is set.
Use `textContent` for questions and player names.

If loading JSON with `fetch`, run the project on localhost (for example with VS
Code Live Server). Browsers generally block fetching local JSON when the HTML is
opened through `file://`; direct opening is enough only for the design preview.

Ignore empty answers without using an attempt. Trim spaces before comparing.
Agree on accepted Arabic spellings/alternative answers; the current JSON contains
one answer per question, but it can be extended with a list of accepted answers.

### 2. Shared controls on both quiz pages

| Element | JavaScript responsibility |
| --- | --- |
| `#question-text` | Display the current question |
| `#answer` | Read the typed answer; clear and focus for a new question |
| `#check-answer` | Check on click; also handle Enter in the input |
| `#feedback` | Existing live region containing the feedback messages |
| `#correct-answer` | Fill the correction shown after three wrong answers |
| `#hint-toggle` | Enable after two wrong attempts; reveal the hint on click |
| `#hint-text` | Fill the current hint |
| `#next-question` | Enable after a correct answer or three failed attempts |
| `#skip-question` | Skip this question and advance once |

The answer area is a `div`, not a form, so Enter needs an event handler. Once a
question ends, stop accepting answers and prevent duplicate point awards. Keep
feedback visible until Next is clicked. A skipped question earns no answer points.

### 3. Visual states already supported by the CSS

Change these attributes on the `#quiz` container:

| Attribute | Values | Visual effect |
| --- | --- | --- |
| `data-attempts-left` | `3`, `2`, `1`, `0` | Chechias turn gray; khamsa artwork opens at `1` or `0` |
| `data-status` | `ready`, `wrong`, `correct`, `exhausted` | Matching feedback and colors |
| `data-hint-state` | `hidden`, `revealed` | Reveals the hint when attempts are `1` or `0` |
| `data-player` (VS only) | `1`, `2` | Active card, turn label and answer-field accent |

For example, after the second wrong answer:

```js
const quiz = document.querySelector("#quiz");
quiz.dataset.attemptsLeft = "1";
quiz.dataset.status = "wrong";
document.querySelector("#hint-toggle").disabled = false;
```

**Opening the khamsa artwork does not reveal the hint.** Its click handler must
set `quiz.dataset.hintState = "revealed"` and `aria-expanded="true"` on the button.
Apply any hint penalty only once per question.

For every new question, reset attempts to `3`, status to `ready`, hint to `hidden`,
input to empty, and Hint/Next to disabled. Reset `aria-expanded` to `false` and
allow submissions again. Update the Arabic `aria-label` on `.lives` to describe
remaining attempts, and keep the input's `aria-invalid` in sync with errors/reset.

### 4. Solo mode

- Home opens `quiz.html?mode=solo`. Update `#score` and `#timer`.
- The displayed `04:20` is a placeholder. Agree on the real duration and end the
  game when time runs out or all selected questions are finished.
- Save the result, for example in `sessionStorage`, then open `results.html`.
- On that page, fill `#final-score` with the total points earned and update the
  accessible label on `.final-score`. `#result-message` labels the points total
  and can be updated if needed.
- The solo result shows points only, with no question total or correct-answer
  count. There is no `#final-total` element.

### 5. Two-player mode

The existing form requires both names, rejects spaces-only input and limits each
name to 24 characters. It submits to:

```text
versus-quiz.html?mode=versus&player1=...&player2=...
```

Read names with `URLSearchParams`, trim and validate them again because the URL
can be edited. If either is missing, return to `versus.html`.

| Player | Fill name in | Update score in | Card |
| --- | --- | --- | --- |
| 1 (blue) | `#player-one-display`, `#player-one-turn` | `#player-one-score` | `#player-one-card` |
| 2 (gold) | `#player-two-display`, `#player-two-turn` | `#player-two-score` | `#player-two-card` |

Start with P1, then P2, then P1, with a different question each turn. Switch after
a completed or skipped question, **not after each wrong attempt**. Each player
gets three attempts on their question and the same total number of questions.
Keep scores separately. There is no countdown in VS.

Set `data-player` on `#quiz` when switching. Update both cards' Arabic `aria-label`
values, with `aria-current="true"` only on the active card. Reset the shared quiz
controls for each new question.

At the end, save both names/scores and open `versus-results.html`. Fill:

| Player | Result name | Winner-message name | Final score |
| --- | --- | --- | --- |
| 1 | `#player-one-result-name` | `#winner-one-name` | `#player-one-final-score` |
| 2 | `#player-two-result-name` | `#winner-two-name` | `#player-two-final-score` |

Set `data-winner` on `#versus-result` to `"1"`, `"2"` or `"draw"` after comparing
scores. CSS shows the matching winner/message. The initial `"pending"` state is a
placeholder. Both results pages already link home. Handle opening results without
stored data, and clear old game data when starting again.

## Rules to agree on together

The design does not set numerical scoring rules. Decide:

- Points per correct answer and whether attempts affect the reward.
- The reduction when a hint is revealed (the home rules promise a reduction).
- Whether skipping has a penalty beyond earning no answer points.
- Solo duration/question count and an equal question count for each VS player.

Home still says "who is faster?" for VS from the earlier design. Since VS now has
no timer, review that wording together when finalizing the game rules.

## Checks before submitting

The phone layout uses the viewport height, a compact header and tighter spacing
so the controls fit on normal portrait screens. Tablet styles (600-1100px wide)
use larger text and controls. Very short landscape windows and the onscreen
keyboard can still require scrolling; content is never hidden to force a fit.
Long questions and hints scroll inside their own areas without moving the controls.
All layout changes remain in CSS; no JavaScript was added.

- Correct/wrong/empty answers, third failure, Skip and Next all work.
- Hint unlocks after two failures, reveals only on click and resets each question.
- Click and Enter work; repeated clicks cannot award points or advance twice.
- Solo time expiration ends the game; VS alternates fairly without a timer.
- Names, both scores, either winner and a draw display correctly.
- Refreshes, direct links and starting a new game are handled.
- Recheck keyboard access, long Arabic text and responsive layouts with real data.
- Run final HTML/CSS through W3C validators. Formal W3C validation remains pending;
  local checks and browser previews do not replace it.
