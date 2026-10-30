const quiz = document.getElementById("quiz");

const questionText = document.getElementById("question-text");
const answerInput = document.getElementById("answer");
const checkButton = document.getElementById("check-answer");
const skipButton = document.getElementById("skip-question");
const nextButton = document.getElementById("next-question");
const restartButton = document.getElementById("restart-game");
const optionButtons = document.querySelectorAll(".qcm-option");

const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const progressBar = document.getElementById("quiz-progress");

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
let acceptedAnswers = [];
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

function updateProgress(value) {
  progressBar.value = value;
  const remaining = progressBar.max - value;

  if (remaining <= progressBar.max / 6) {
    progressBar.dataset.level = "danger";
  } else if (remaining <= progressBar.max / 3) {
    progressBar.dataset.level = "warning";
  } else {
    progressBar.dataset.level = "normal";
  }
}

// Initialize the game.
function startGame() {
  // Remove results from the previous game.
  ["soloScore", "soloTotalQuestions", "soloRemainingQuestions", "soloFinishReason"].forEach((key) => {
    sessionStorage.removeItem(key);
  });

  score = 0;
  timer = TOTAL_TIME;
  progressBar.max = TOTAL_TIME;
  updateProgress(0);
  gameOver = false;

  remainingQuestions = [...questions];

  // Randomize the order of the questions.
  remainingQuestions.sort(() => Math.random() - 0.5);

  scoreDisplay.textContent = score;
  restartButton.disabled = false;

  nextQuestion();

  timerDisplay.textContent = formatTime(timer);

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timer--;

    timerDisplay.textContent = formatTime(timer);
    updateProgress(TOTAL_TIME - timer);

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
  acceptedAnswers = Array.isArray(currentQuestion.answer)
    ? currentQuestion.answer
    : [currentQuestion.answer];

  attemptsLeft = MAX_ATTEMPTS;
  hintUsed = false;

  quiz.dataset.attemptsLeft = attemptsLeft;
  quiz.dataset.status = "ready";
  quiz.dataset.hintState = "hidden";
  quiz.dataset.type = currentQuestion.type;

  optionButtons.forEach((button, index) => {
    button.textContent = currentQuestion.options?.[index] || "";
    button.disabled = false;
    delete button.dataset.selected;
    delete button.dataset.result;
  });

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
  correctAnswerDisplay.textContent = acceptedAnswers[0];

  hintContent.classList.remove("is-visible");

  feedback.classList.remove(
    "is-wrong",
    "is-correct",
    "is-exhausted"
  );

  updateAttempts();
  if (currentQuestion.type === "qcm") {
    optionButtons[0].focus();
  } else {
    answerInput.focus();
  }
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

  if (acceptedAnswers.some((answer) => userAnswer === normalizeAnswer(answer))) {
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

  // A QCM has one choice; text riddles keep their three attempts.
  attemptsLeft = currentQuestion.type === "qcm" ? 0 : attemptsLeft - 1;
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

  optionButtons.forEach((button) => {
    button.disabled = true;
    if (button.textContent === currentQuestion.answer) {
      button.dataset.result = "correct";
    } else if (button.dataset.selected === "true") {
      button.dataset.result = "wrong";
    }
  });
  nextButton.focus();
}

// Reveal the hint.
function revealHint() {
  if (currentQuestion.type === "qcm") return;
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
optionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.disabled || gameOver) return;
    button.dataset.selected = "true";
    answerInput.value = button.textContent;
    checkAnswer();
  });
});

checkButton.addEventListener("click", checkAnswer);

answerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    checkAnswer();
  }
});

nextButton.addEventListener("click", () => slideQuestion(nextQuestion));

skipButton.addEventListener("click", () => slideQuestion(skipQuestion));
restartButton.addEventListener("click", startGame);

hintToggle.addEventListener("click", revealHint);

// Start loading the questions.
loadQuestions();
