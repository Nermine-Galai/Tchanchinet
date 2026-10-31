// solo mode uses the shared rules, with a countdown added
const TOTAL_TIME = 3 * 60;
const timerDisplay = document.getElementById("timer");
let remainingQuestions = [];
let score = 0;
let timer = TOTAL_TIME;
let timerInterval = null;

// start over with a fresh timer and score, but keep the best scores
function startGame() {
  sessionStorage.removeItem("soloScore");
  sessionStorage.removeItem("soloTotalQuestions");
  sessionStorage.removeItem("soloRemainingQuestions");
  sessionStorage.removeItem("soloFinishReason");
  score = 0;
  timer = TOTAL_TIME;
  gameOver = false;
  // copy the list so we can shuffle it without losing questions for replay
  remainingQuestions = questions.slice();
  remainingQuestions.sort(function () {
    return Math.random() - 0.5;
  });
  scoreDisplay.textContent = score;
  timerDisplay.textContent = formatTime(timer);
  progressBar.max = TOTAL_TIME;
  updateProgress(0);
  restartButton.disabled = false;
  nextQuestion();

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    // pause the timer while reading the result or switching questions
    if (!nextButton.disabled || questionSliding) return;
    timer--;
    timerDisplay.textContent = formatTime(timer);
    updateProgress(TOTAL_TIME - timer);
    if (timer <= 0) finishGame("time");
  }, 1000);
}

// turn the seconds into a minutes:seconds display
function formatTime(seconds) {
  return String(Math.floor(seconds / 60)).padStart(2, "0") + ":" +
    String(seconds % 60).padStart(2, "0");
}

// pick the next riddle, or finish if there are none left
function nextQuestion() {
  if (gameOver) return;
  if (remainingQuestions.length === 0) {
    finishGame("complete");
    return;
  }
  showQuestion(remainingQuestions.pop());
}

// skip this one without adding points
function skipQuestion() {
  if (gameOver || questionEnded) return;
  nextQuestion();
}

// save this game once, stop the timer and go to the results
function finishGame(reason) {
  if (gameOver) return;
  gameOver = true;
  clearInterval(timerInterval);
  saveTopScores("soloBestScores", [{ score, date: new Date().toLocaleDateString() }]);
  sessionStorage.setItem("soloScore", String(score));
  sessionStorage.setItem("soloTotalQuestions", String(questions.length));
  sessionStorage.setItem("soloRemainingQuestions", String(remainingQuestions.length));
  sessionStorage.setItem("soloFinishReason", reason);
  window.location.href = "results.html";
}

bindQuizControls();
loadQuestions();
