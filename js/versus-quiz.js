const quiz = document.getElementById("quiz");
const questionText = document.getElementById("question-text");
const answerInput = document.getElementById("answer");
const checkButton = document.getElementById("check-answer");
const skipButton = document.getElementById("skip-question");
const nextButton = document.getElementById("next-question");
const feedback = document.getElementById("feedback");
const correctAnswerDisplay = document.getElementById("correct-answer");
const hintToggle = document.getElementById("hint-toggle");
const hintText = document.getElementById("hint-text");
const hintContent = document.getElementById("hint-content");

const POINTS_BY_ATTEMPT = [100, 80, 50];
const POINTS_WITH_HINT = 25;
const MAX_ATTEMPTS = 3;
const QUESTIONS_PER_PLAYER = 5;
const TOTAL_TURNS = QUESTIONS_PER_PLAYER * 2;

const MAX_NAME_LENGTH = 24;

const players = {
  1: {
    name: "",
    score: 0,
    scoreEl: document.getElementById("player-one-score"),
    nameEl: document.getElementById("player-one-display"),
    turnEl: document.getElementById("player-one-turn"),
    card: document.getElementById("player-one-card"),
  },
  2: {
    name: "",
    score: 0,
    scoreEl: document.getElementById("player-two-score"),
    nameEl: document.getElementById("player-two-display"),
    turnEl: document.getElementById("player-two-turn"),
    card: document.getElementById("player-two-card"),
  },
};

let questions = [];
let queue = [];
let currentQuestion = null;
let currentPlayer = 1;
let turnsPlayed = 0;
let attemptsLeft = MAX_ATTEMPTS;
let hintUsed = false;
let questionEnded = false;
let gameOver = false;

// Only clean up spacing; accepted spellings belong in the JSON answer list.
function normalizeAnswer(value) {
  return value.trim().replace(/\s+/g, " ");
}

// Read and validate names from the URL (it can be edited by hand).
function readPlayers() {
  const params = new URLSearchParams(window.location.search);
  const p1 = (params.get("player1") || "").trim().slice(0, MAX_NAME_LENGTH);
  const p2 = (params.get("player2") || "").trim().slice(0, MAX_NAME_LENGTH);

  if (!p1 || !p2) {
    window.location.replace("versus.html");
    return false;
  }

  players[1].name = p1;
  players[2].name = p2;

  [1, 2].forEach((n) => {
    players[n].nameEl.textContent = players[n].name;
    players[n].turnEl.textContent = players[n].name;
    players[n].scoreEl.textContent = "0";
  });

  return true;
}

async function loadQuestions() {
  try {
    const response = await fetch("../assets/tunisian_riddles_40.json");
    if (!response.ok) throw new Error("Failed to load riddles.");
    questions = await response.json();
    if (!Array.isArray(questions) || questions.length < TOTAL_TURNS) {
      throw new Error("Not enough questions.");
    }
    startGame();
  } catch (error) {
    console.error(error);
    questionText.textContent =
      "ما نجّمنـاش نحمّلو التشنشينات. عاود افتح اللعبة باستعمال Live Server.";
    checkButton.disabled = true;
    skipButton.disabled = true;
    nextButton.disabled = true;
  }
}

function startGame() {
  sessionStorage.removeItem("versusResult");
  queue = [...questions].sort(() => Math.random() - 0.5);
  turnsPlayed = 0;
  currentPlayer = 1;
  gameOver = false;
  newQuestion();
}

function setActivePlayer(n) {
  currentPlayer = n;
  quiz.dataset.player = String(n);

  [1, 2].forEach((i) => {
    const p = players[i];
    const active = i === n;
    const label = i === 1 ? "اللاعب الأول" : "اللاعب الثاني";
    p.card.setAttribute(
      "aria-label",
      `${label}، ${p.name}${active ? "، دوره توّا" : ""}`
    );
    if (active) {
      p.card.setAttribute("aria-current", "true");
    } else {
      p.card.removeAttribute("aria-current");
    }
  });
}

function updateAttempts() {
  quiz.dataset.attemptsLeft = String(attemptsLeft);

  document.querySelectorAll(".attempt").forEach((attempt) => {
    attempt.classList.toggle(
      "is-lost",
      Number(attempt.dataset.attempt) > attemptsLeft
    );
  });

  const lives = document.querySelector(".lives");
  if (lives) {
    lives.setAttribute("aria-label", `${attemptsLeft} محاولات متبقّية`);
  }
}

function newQuestion() {
  if (gameOver) return;

  if (turnsPlayed >= TOTAL_TURNS || queue.length === 0) {
    finishGame();
    return;
  }

  // P1, P2, P1, P2... each turn has a different question.
  setActivePlayer(turnsPlayed % 2 === 0 ? 1 : 2);
  currentQuestion = queue.pop();

  attemptsLeft = MAX_ATTEMPTS;
  hintUsed = false;
  questionEnded = false;

  quiz.dataset.status = "ready";
  quiz.dataset.hintState = "hidden";

  questionText.textContent = currentQuestion.question;
  hintText.textContent = currentQuestion.hint;
  correctAnswerDisplay.textContent = currentQuestion.answer[0];

  answerInput.value = "";
  answerInput.disabled = false;
  answerInput.removeAttribute("aria-invalid");

  checkButton.disabled = false;
  skipButton.disabled = false;
  nextButton.disabled = true;

  hintToggle.disabled = true;
  hintToggle.setAttribute("aria-expanded", "false");
  hintContent.classList.remove("is-visible");

  feedback.classList.remove("is-wrong", "is-correct", "is-exhausted");

  updateAttempts();
  answerInput.focus();
}

function endCurrentQuestion(status) {
  questionEnded = true;
  quiz.dataset.status = status;

  answerInput.disabled = true;
  checkButton.disabled = true;
  skipButton.disabled = true;
  nextButton.disabled = false;
  hintToggle.disabled = true;

  // Last turn: the Next button leads to the results.
  nextButton.focus();
}

function checkAnswer() {
  if (gameOver || !currentQuestion || questionEnded) return;

  const userAnswer = normalizeAnswer(answerInput.value);
  if (!userAnswer) {
    answerInput.focus();
    return;
  }

  const player = players[currentPlayer];

  if (currentQuestion.answer.some((answer) => userAnswer === normalizeAnswer(answer))) {
    player.score += hintUsed
      ? POINTS_WITH_HINT
      : POINTS_BY_ATTEMPT[MAX_ATTEMPTS - attemptsLeft];
    player.scoreEl.textContent = player.score;

    answerInput.removeAttribute("aria-invalid");
    feedback.classList.remove("is-wrong", "is-exhausted");
    feedback.classList.add("is-correct");
    endCurrentQuestion("correct");
    return;
  }

  attemptsLeft--;
  answerInput.value = "";
  updateAttempts();
  answerInput.setAttribute("aria-invalid", "true");

  feedback.classList.remove("is-correct", "is-exhausted");
  feedback.classList.add("is-wrong");
  quiz.dataset.status = "wrong";

  if (attemptsLeft === 1) {
    hintToggle.disabled = false;
  }

  if (attemptsLeft <= 0) {
    feedback.classList.remove("is-wrong");
    feedback.classList.add("is-exhausted");
    endCurrentQuestion("exhausted");
    return;
  }

  answerInput.focus();
}

function revealHint() {
  if (gameOver || questionEnded || attemptsLeft !== 1 || hintUsed) return;

  hintUsed = true;
  quiz.dataset.hintState = "revealed";
  hintContent.classList.add("is-visible");
  hintToggle.setAttribute("aria-expanded", "true");
  hintToggle.disabled = true;
}

function advance() {
  if (gameOver) return;
  turnsPlayed++;
  newQuestion();
}

function skipQuestion() {
  if (gameOver || questionEnded) return;
  questionEnded = true; // guard against double clicks
  advance();
}

function nextQuestion() {
  if (gameOver || !questionEnded) return;
  questionEnded = false;
  advance();
}

function finishGame() {
  if (gameOver) return;
  gameOver = true;

  sessionStorage.setItem(
    "versusResult",
    JSON.stringify({
      player1: { name: players[1].name, score: players[1].score },
      player2: { name: players[2].name, score: players[2].score },
    })
  );

  window.location.href = "versus-results.html";
}

checkButton.addEventListener("click", checkAnswer);
answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    checkAnswer();
  }
});
nextButton.addEventListener("click", nextQuestion);
skipButton.addEventListener("click", skipQuestion);
hintToggle.addEventListener("click", revealHint);

if (readPlayers()) {
  loadQuestions();
}
