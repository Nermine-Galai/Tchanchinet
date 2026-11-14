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

const POINTS_BY_ATTEMPT = [100, 80, 50];
const POINTS_WITH_HINT = 25;
const MAX_ATTEMPTS = 3;


const TIME_PENALTY_INTERVAL = 10;
const TIME_PENALTY_POINTS = 5;
const MAX_TIME_PENALTY = 25;

let questions = [];
let currentQuestion = null;
let acceptedAnswers = [];
let attemptsLeft = MAX_ATTEMPTS;
let hintUsed = false;
let questionEnded = false;
let gameOver = false;


let questionStartTime = 0;

// ignore extra spaces; the allowed spellings stay in the json file
function normalizeAnswer(value) {
  return value.trim().replace(/\s+/g, " ");
}

// Load questions from PHP and start the game
async function loadQuestions(minimum = 1) {
  try {
    const response = await fetch("/Tchanchinet/php/get_questions.php");

    if (!response.ok) {
      throw new Error("Failed to load questions from PHP.");
    }

    questions = await response.json();

    if (!Array.isArray(questions) || questions.length < minimum) {
      throw new Error("Not enough questions.");
    }

    startGame();

  } catch (error) {
    console.error(error);

    questionText.textContent =
      "ما نجّمنـاش نحمّلو التشنشينات. عاود المحاولة.";

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

// Display a question and initialize its PHP session
async function showQuestion(question) {
  currentQuestion = question;
  acceptedAnswers = [];

  questionStartTime = Date.now();
  attemptsLeft = MAX_ATTEMPTS;
  hintUsed = false;
  questionEnded = false;

  quiz.dataset.status = "ready";
  quiz.dataset.hintState = "hidden";
  quiz.dataset.type = question.type;

  questionText.textContent = question.question;
  hintText.textContent = "";
  correctAnswerDisplay.textContent = "";

  // Reset the four QCM buttons
  for (let i = 0; i < optionButtons.length; i++) {
    const button = optionButtons[i];
    button.textContent = question.options?.[i] || "";
    button.disabled = true;
    button.removeAttribute("data-selected");
    button.removeAttribute("data-result");
  }

  // Disable controls until PHP initializes the question
  answerInput.value = "";
  answerInput.disabled = true;
  checkButton.disabled = true;
  skipButton.disabled = true;
  nextButton.disabled = true;
  hintToggle.disabled = true;

  hintToggle.setAttribute("aria-expanded", "false");
  updateAttempts();

  try {
    const formData = new FormData();
    formData.append("id", question.id);

    const response = await fetch(
      "/Tchanchinet/php/commencer_question.php",
      {
        method: "POST",
        body: formData
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Impossible de démarrer la question.");
    }

    // PHP successfully initialized the question
    answerInput.disabled = false;
    checkButton.disabled = false;
    skipButton.disabled = false;

    if (question.type === "qcm") {
      optionButtons.forEach(button => {
        button.disabled = !button.textContent;
      });
      optionButtons[0].focus();
    } else {
      answerInput.focus();
    }

  } catch (error) {
    console.error(error);
    questionText.textContent = "Erreur lors du démarrage de la question.";
  }
}

// update the attempt icons and the label read by screen readers
function updateAttempts() {
  quiz.dataset.attemptsLeft = attemptsLeft;
  document.querySelector(".lives").setAttribute("aria-label", `${attemptsLeft} محاولات متبقّية`);
}

// take off five points for every full ten seconds, up to 25
function calculateTimePenalty() {
  const seconds = Math.floor((Date.now() - questionStartTime) / 1000);
  return Math.min(
    Math.floor(seconds / TIME_PENALTY_INTERVAL) * TIME_PENALTY_POINTS,
    MAX_TIME_PENALTY
  );
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

// check the answer, update the points or attempts, and show the result
async function checkAnswer() {
  if (gameOver || !currentQuestion || questionEnded) return;

  const userAnswer = normalizeAnswer(answerInput.value);

  if (!userAnswer) {
    answerInput.focus();
    return;
  }

  checkButton.disabled = true;

  try {
    const formData = new FormData();
    formData.append("id", currentQuestion.id);
    formData.append("answer", userAnswer);

    const response = await fetch(
      "/Tchanchinet/php/verifier_reponse.php",
      {
        method: "POST",
        body: formData
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Erreur de vérification.");
    }

    attemptsLeft = result.attempts_left;
    updateAttempts();

    if (result.correct) {
      addPoints(result.points);

      correctAnswerDisplay.textContent = result.bonne_reponse;
      answerInput.removeAttribute("aria-invalid");

      endCurrentQuestion("correct");
      return;
    }

    answerInput.value = "";
    answerInput.setAttribute("aria-invalid", "true");
    quiz.dataset.status = "wrong";

    if (result.finished) {
      correctAnswerDisplay.textContent = result.bonne_reponse;
      endCurrentQuestion("exhausted");
      return;
    }

    if (attemptsLeft === 1) {
      hintToggle.disabled = false;
    }

    answerInput.focus();

  } catch (error) {
    console.error(error);
    alert("Impossible de vérifier la réponse. Réessayez.");
  } finally {
    if (!questionEnded) {
      checkButton.disabled = false;
    }
  }
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
  if (
    button.textContent === correctAnswerDisplay.textContent
  ) {
    button.dataset.result = "correct";
  } else if (button.dataset.selected === "true") {
    button.dataset.result = "wrong";
  }
  }
  if (versusMode) updateProgress(turnsPlayed + 1);
  nextButton.focus();
}

// Retrieve the hint from PHP after two incorrect attempts
async function revealHint() {
  if (!currentQuestion || currentQuestion.type === "qcm") return;
  if (gameOver || questionEnded || attemptsLeft !== 1 || hintUsed) return;

  hintToggle.disabled = true;

  try {
    const formData = new FormData();
    formData.append("id", currentQuestion.id);

    const response = await fetch(
      "/Tchanchinet/php/ouvrir_indice.php",
      {
        method: "POST",
        body: formData
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Impossible d'obtenir l'indice.");
    }

    hintUsed = true;
    hintText.textContent = result.hint;
    quiz.dataset.hintState = "revealed";
    hintToggle.setAttribute("aria-expanded", "true");

  } catch (error) {
    console.error(error);
    alert("Impossible de charger l'indice. Réessayez.");
    hintToggle.disabled = false;
  }
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
  skipButton.addEventListener("click", async function () {
      if (gameOver || questionEnded || !currentQuestion) return;

      skipButton.disabled = true;

      try {
          const response = await fetch(
              "/Tchanchinet/php/terminer_question.php",
              { method: "POST" }
          );

          const result = await response.json();

          if (!response.ok) {
              throw new Error(result.error || "Impossible de terminer la question.");
          }

          slideQuestion(skipQuestion);

      } catch (error) {
          console.error(error);
          alert("Impossible de passer cette question. Réessayez.");
          skipButton.disabled = false;
      }
  });
  restartButton.addEventListener("click", startGame);
  hintToggle.addEventListener("click", revealHint);
}
