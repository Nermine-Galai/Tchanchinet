const quiz = document.getElementById("quiz");

const questionText = document.getElementById("question-text");
const answerInput = document.getElementById("answer");
const checkButton = document.getElementById("check-answer");
const skipButton = document.getElementById("skip-question");
const nextButton = document.getElementById("next-question");

const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");

const feedback = document.getElementById("feedback");
const correctAnswerDisplay = document.getElementById("correct-answer");

const hintToggle = document.getElementById("hint-toggle");
const hintText = document.getElementById("hint-text");
const hintContent = document.getElementById("hint-content");

const TOTAL_TIME = 3 * 60;
const POINTS_BY_ATTEMPT = [100, 80, 50];
const POINTS_WITH_HINT = 25;
const MAX_ATTEMPTS = 3;

let questions = [];
let currentQuestion = null;
let remainingQuestions = [];
let attemptsLeft = MAX_ATTEMPTS;
let score = 0;
let hintUsed = false;
let gameOver = false;
let timer = TOTAL_TIME;
let timerInterval = null;

// Only clean up spacing; accepted spellings belong in the JSON answer list.
function normalizeAnswer(value) {
  return value.trim().replace(/\s+/g, " ");
}

// Load the riddles from the JSON file.
async function loadQuestions() {
  try {
    const response = await fetch(
      "../assets/tunisian_riddles_40.json"
    );

    if (!response.ok) {
      throw new Error("Failed to load riddles.");
    }

    questions = await response.json();

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("The question list is empty.");
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

// Initialize the game.
function startGame() {
  score = 0;
  timer = TOTAL_TIME;
  gameOver = false;

  remainingQuestions = [...questions];

  // Randomize the order of the questions.
  remainingQuestions.sort(() => Math.random() - 0.5);

  scoreDisplay.textContent = score;

  nextQuestion();

  timerDisplay.textContent = formatTime(timer);

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timer--;

    timerDisplay.textContent = formatTime(timer);

    if (timer <= 0) {
      finishGame("time");
    }
  }, 1000);
}

// Format seconds as MM:SS.
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(remainingSeconds).padStart(2, "0")
  );
}

// Display a new question.
function nextQuestion() {
  if (gameOver) return;

  if (remainingQuestions.length === 0) {
    finishGame("complete");
    return;
  }

  currentQuestion = remainingQuestions.pop();

  attemptsLeft = MAX_ATTEMPTS;
  hintUsed = false;

  quiz.dataset.attemptsLeft = attemptsLeft;
  quiz.dataset.status = "ready";
  quiz.dataset.hintState = "hidden";

  questionText.textContent = currentQuestion.question;

  answerInput.value = "";
  answerInput.disabled = false;
  answerInput.removeAttribute("aria-invalid");

  checkButton.disabled = false;
  skipButton.disabled = false;
  nextButton.disabled = true;

  hintToggle.disabled = true;
  hintToggle.setAttribute("aria-expanded", "false");

  hintText.textContent = currentQuestion.hint;
  correctAnswerDisplay.textContent = currentQuestion.answer[0];

  hintContent.classList.remove("is-visible");

  feedback.classList.remove(
    "is-wrong",
    "is-correct",
    "is-exhausted"
  );

  updateAttempts();
  answerInput.focus();
}

// Update the remaining attempts and their artwork.
function updateAttempts() {
  quiz.dataset.attemptsLeft = attemptsLeft;

  document.querySelectorAll(".attempt").forEach((attempt) => {
    const number = Number(attempt.dataset.attempt);

    attempt.classList.toggle(
      "is-lost",
      number > attemptsLeft
    );
  });

  const lives = document.querySelector(".lives");

  if (lives) {
    lives.setAttribute(
      "aria-label",
      `${attemptsLeft} محاولات متبقّية`
    );
  }
}

// Check the user's answer.
function checkAnswer() {
  if (gameOver || !currentQuestion) return;
  if (nextButton.disabled === false) return;

  const userAnswer = normalizeAnswer(answerInput.value);

  if (!userAnswer) {
    answerInput.focus();
    return;
  }

  if (currentQuestion.answer.some((answer) => userAnswer === normalizeAnswer(answer))) {
    score += hintUsed
      ? POINTS_WITH_HINT
      : POINTS_BY_ATTEMPT[MAX_ATTEMPTS - attemptsLeft];
    scoreDisplay.textContent = score;

    quiz.dataset.status = "correct";
    answerInput.removeAttribute("aria-invalid");
    feedback.classList.remove("is-wrong", "is-exhausted");
    feedback.classList.add("is-correct");

    endCurrentQuestion();
    return;
  }

  attemptsLeft--;
  answerInput.value = "";
  answerInput.setAttribute("aria-invalid", "true");
  quiz.dataset.status = "wrong";

  updateAttempts();

  feedback.classList.remove("is-correct", "is-exhausted");
  feedback.classList.add("is-wrong");

  if (attemptsLeft === 1) {
    // Two incorrect answers: unlock the hint.
    hintToggle.disabled = false;
  }

  if (attemptsLeft <= 0) {
    // Three incorrect answers: reveal the answer.
    quiz.dataset.status = "exhausted";

    feedback.classList.remove("is-wrong");
    feedback.classList.add("is-exhausted");

    endCurrentQuestion();
    return;
  }

  answerInput.focus();
}

// Finish the current question.
function endCurrentQuestion() {
  answerInput.disabled = true;
  checkButton.disabled = true;
  skipButton.disabled = true;
  nextButton.disabled = false;

  hintToggle.disabled = true;
  quiz.dataset.status =
    quiz.dataset.status === "correct" ? "correct" : "exhausted";
}

// Reveal the hint.
function revealHint() {
  if (gameOver || attemptsLeft !== 1 || hintUsed) return;

  hintUsed = true;

  quiz.dataset.hintState = "revealed";

  hintContent.classList.add("is-visible");

  hintToggle.setAttribute("aria-expanded", "true");
  hintToggle.disabled = true;
}

// Skip the current question without earning points.
function skipQuestion() {
  if (gameOver) return;

  nextQuestion();
}

// Finish the game and save the score.
function finishGame(reason) {
  if (gameOver) return;

  gameOver = true;

  clearInterval(timerInterval);

  sessionStorage.setItem("soloScore", String(score));
  sessionStorage.setItem("soloTotalQuestions", String(questions.length));
  sessionStorage.setItem("soloRemainingQuestions", String(remainingQuestions.length));
  sessionStorage.setItem("soloFinishReason", reason);

  window.location.href = "results.html";
}

// Event listeners.
checkButton.addEventListener("click", checkAnswer);

answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    checkAnswer();
  }
});

nextButton.addEventListener("click", nextQuestion);

skipButton.addEventListener("click", skipQuestion);

hintToggle.addEventListener("click", revealHint);

// Start loading the questions.
loadQuestions();
