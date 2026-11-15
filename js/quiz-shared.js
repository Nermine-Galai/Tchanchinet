// the two quiz modes use these same elements and rules
const quiz = document.getElementById("quiz");
const versusMode = document.body.classList.contains("duel-page");
const questionText = document.getElementById("question-text");
const answerInput = document.getElementById("answer");
const checkButton = document.getElementById("check-answer");
const skipButton = document.getElementById("skip-question");
const nextButton = document.getElementById("next-question");
const restartButton = document.getElementById("restart-game");
const optionButtons = document.querySelectorAll(".qcm-option");
const progressBar = document.getElementById("quiz-progress");
const progressFill = document.getElementById("progress-fill");
const scoreDisplay = document.getElementById("score");
const correctAnswerDisplay = document.getElementById("correct-answer");
const hintToggle = document.getElementById("hint-toggle");
const hintText = document.getElementById("hint-text");

// the points and the time penalty are calculated by php/verifier_reponse.php
const MAX_ATTEMPTS = 3;

let questions = [];
let currentQuestion = null;
let correctAnswer = "";
let waitingServer = false;
let attemptsLeft = MAX_ATTEMPTS;
let hintUsed = false;
let questionEnded = false;
let gameOver = false;

// ignore extra spaces; the allowed spellings stay in the database
function normalizeAnswer(value) {
  return value.trim().replace(/\s+/g, " ");
}

// ask php for the riddles (without the answers) and check there are enough
async function loadQuestions(minimum = 1) {
  try {
    const response = await fetch("../php/get_questions.php");
    if (!response.ok) throw new Error("Failed to load riddles.");
    questions = await response.json();
    if (!Array.isArray(questions) || questions.length < minimum) {
      throw new Error("Not enough questions.");
    }
    startGame();
  } catch (error) {
    console.error(error);
    questionText.textContent =
      "ما نجّمنـاش نحمّلو التشنشينات. ثبّت إلّي سرفر PHP و MySQL يخدمو.";
    checkButton.disabled = true;
    skipButton.disabled = true;
    nextButton.disabled = true;
  }
}

// fill the bar and pick its color from what is left
function updateProgress(value) {
  progressBar.value = value;
  const percentage = (progressBar.value / progressBar.max) * 100;
  progressFill.style.width = percentage + "%";
  const remaining = progressBar.max - value;
  const redLimit = progressBar.max / 6;
  const yellowLimit = progressBar.max / 3;

  if (remaining <= redLimit) {
    progressBar.dataset.level = "danger";
  } else if (remaining <= yellowLimit) {
    progressBar.dataset.level = "warning";
  } else {
    progressBar.dataset.level = "normal";
  }
}

// put the new question on screen and clear the previous question state
function showQuestion(question) {
  currentQuestion = question;
  // the answer stays on the server until the question is finished
  correctAnswer = "";
  // tell php which question starts now, so the server keeps the clock and the attempts
  const data = new FormData();
  data.append("id", question.id);
  fetch("../php/commencer_question.php", { method: "POST", body: data });
  attemptsLeft = MAX_ATTEMPTS;
  hintUsed = false;
  questionEnded = false;
  quiz.dataset.status = "ready";
  quiz.dataset.hintState = "hidden";
  quiz.dataset.type = question.type;
  questionText.textContent = question.question;
  hintText.textContent = question.hint;
  correctAnswerDisplay.textContent = "";

  // fill the four buttons and clear any old selection or result
  for (let i = 0; i < optionButtons.length; i++) {
    const button = optionButtons[i];
    button.textContent = "";
    if (question.options && question.options[i]) {
      button.textContent = question.options[i];
    }
    button.disabled = false;
    button.removeAttribute("data-selected");
    button.removeAttribute("data-result");
  }

  answerInput.value = "";
  answerInput.disabled = false;
  answerInput.removeAttribute("aria-invalid");
  checkButton.disabled = false;
  skipButton.disabled = false;
  nextButton.disabled = true;
  hintToggle.disabled = true;
  hintToggle.setAttribute("aria-expanded", "false");
  updateAttempts();
  if (question.type === "qcm") {
    optionButtons[0].focus();
  } else {
    answerInput.focus();
  }
}

// update the attempt icons and the label read by screen readers
function updateAttempts() {
  quiz.dataset.attemptsLeft = attemptsLeft;
  document.querySelector(".lives").setAttribute("aria-label", `${attemptsLeft} محاولات متبقّية`);
}

// add the points to the solo score or the player whose turn it is
function addPoints(points) {
  if (versusMode) {
    const player = players[currentPlayer];
    player.score += points;
    player.scoreEl.textContent = player.score;
  } else {
    score += points;
    scoreDisplay.textContent = score;
  }
}

// send the answer to php, which checks it in the database and sends back the result
async function checkAnswer() {
  if (gameOver || !currentQuestion || questionEnded || waitingServer) return;
  const userAnswer = normalizeAnswer(answerInput.value);
  if (!userAnswer) {
    answerInput.focus();
    return;
  }

  const sentQuestion = currentQuestion;
  const data = new FormData();
  data.append("id", currentQuestion.id);
  data.append("reponse", userAnswer);

  let result = null;
  waitingServer = true;
  try {
    const response = await fetch("../php/verifier_reponse.php", { method: "POST", body: data });
    result = await response.json();
  } catch (error) {
    console.error(error);
  }
  waitingServer = false;

  // do nothing if the server failed or the question changed while waiting
  if (!result || currentQuestion !== sentQuestion || questionEnded) return;

  // php sends the right answer only when the question is finished
  correctAnswer = result.bonne_reponse;
  correctAnswerDisplay.textContent = correctAnswer;

  if (result.correct) {
    // the points already include the attempt, the hint and the time penalty
    addPoints(result.points);
    answerInput.removeAttribute("aria-invalid");
    endCurrentQuestion("correct");
    return;
  }

  // one choice for qcm, three tries for a text question
  attemptsLeft = currentQuestion.type === "qcm" ? 0 : attemptsLeft - 1;
  answerInput.value = "";
  answerInput.setAttribute("aria-invalid", "true");
  quiz.dataset.status = "wrong";
  updateAttempts();
  if (attemptsLeft === 1) hintToggle.disabled = false;
  if (attemptsLeft === 0) {
    endCurrentQuestion("exhausted");
    return;
  }
  answerInput.focus();
}

// stop answers for this question, show the result and enable next
function endCurrentQuestion(status) {
  questionEnded = true;
  quiz.dataset.status = status;
  answerInput.disabled = true;
  checkButton.disabled = true;
  skipButton.disabled = true;
  nextButton.disabled = false;
  hintToggle.disabled = true;
  // mark the right choice and any wrong choice that was clicked
  for (let i = 0; i < optionButtons.length; i++) {
    const button = optionButtons[i];
    button.disabled = true;
    if (button.textContent === correctAnswer) {
      button.dataset.result = "correct";
    } else if (button.dataset.selected === "true") {
      button.dataset.result = "wrong";
    }
  }
  if (versusMode) updateProgress(turnsPlayed + 1);
  nextButton.focus();
}

// after two wrong tries, show the hint and lower the possible points
function revealHint() {
  if (!currentQuestion || currentQuestion.type === "qcm") return;
  if (gameOver || questionEnded || attemptsLeft !== 1 || hintUsed) return;
  hintUsed = true;
  // php remembers the hint and gives fewer points
  fetch("../php/ouvrir_indice.php", { method: "POST" });
  quiz.dataset.hintState = "revealed";
  hintToggle.setAttribute("aria-expanded", "true");
  hintToggle.disabled = true;
}

// use the clicked option as the answer and let the usual check handle it
function chooseOption(event) {
  const button = event.currentTarget;
  if (button.disabled || gameOver) {
    return;
  }
  button.dataset.selected = "true";
  answerInput.value = button.textContent;
  checkAnswer();
}

// move between the four choices with arrows, following the right-to-left grid
function moveOptionFocus(event) {
  const key = event.key;
  if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "ArrowUp" && key !== "ArrowDown") {
    return;
  }
  event.preventDefault();

  let index = 0;
  for (let i = 0; i < optionButtons.length; i++) {
    if (optionButtons[i] === event.currentTarget) {
      index = i;
      break;
    }
  }

  // the first option is on the right, so left moves to the next column
  let nextIndex = index;
  if (key === "ArrowLeft" && index % 2 === 0) {
    nextIndex = index + 1;
  } else if (key === "ArrowRight" && index % 2 === 1) {
    nextIndex = index - 1;
  } else if (key === "ArrowUp" && index >= 2) {
    nextIndex = index - 2;
  } else if (key === "ArrowDown" && index < 2) {
    nextIndex = index + 2;
  }
  optionButtons[nextIndex].focus();
}

// connect the buttons after the functions for this mode are ready
function bindQuizControls() {
  for (let i = 0; i < optionButtons.length; i++) {
    optionButtons[i].addEventListener("click", chooseOption);
    optionButtons[i].addEventListener("keydown", moveOptionFocus);
  }
  checkButton.addEventListener("click", checkAnswer);
  answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkAnswer();
    }
  });
  nextButton.addEventListener("click", function () {
    slideQuestion(nextQuestion);
  });
  skipButton.addEventListener("click", function () {
    slideQuestion(skipQuestion);
  });
  restartButton.addEventListener("click", startGame);
  hintToggle.addEventListener("click", revealHint);
}