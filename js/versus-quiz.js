// same quiz rules, but two players take turns here
const QUESTIONS_PER_PLAYER = 5;
const TOTAL_TURNS = QUESTIONS_PER_PLAYER * 2;
const MAX_NAME_LENGTH = 24;
const players = {
  1: {
    name: "", score: 0,
    scoreEl: document.getElementById("player-one-score"),
    nameEl: document.getElementById("player-one-display"),
    turnEl: document.getElementById("player-one-turn"),
    card: document.getElementById("player-one-card"),
  },
  2: {
    name: "", score: 0,
    scoreEl: document.getElementById("player-two-score"),
    nameEl: document.getElementById("player-two-display"),
    turnEl: document.getElementById("player-two-turn"),
    card: document.getElementById("player-two-card"),
  },
};
let queue = [];
let currentPlayer = 1;
let turnsPlayed = 0;

// get both names from the url and check that neither is empty
function readPlayers() {
  const params = new URLSearchParams(window.location.search);
  for (const n of [1, 2]) {
    const name = (params.get(`player${n}`) || "").trim().slice(0, MAX_NAME_LENGTH);
    if (!name) {
      window.location.replace("versus.html");
      return false;
    }
    players[n].name = name;
    players[n].nameEl.textContent = name;
    players[n].turnEl.textContent = name;
  }
  return true;
}

// start again with the same names and zero scores
function startGame() {
  sessionStorage.removeItem("versusResult");
  for (let n = 1; n <= 2; n++) {
    players[n].score = 0;
    players[n].scoreEl.textContent = "0";
  }
  // copy the list before shuffling so replay still has all the questions
  queue = questions.slice();
  queue.sort(function () {
    return Math.random() - 0.5;
  });
  turnsPlayed = 0;
  currentPlayer = 1;
  gameOver = false;
  progressBar.max = TOTAL_TURNS;
  updateProgress(0);
  restartButton.disabled = false;
  newQuestion();
}

// show whose turn it is on the cards and for screen readers
function setActivePlayer(n) {
  currentPlayer = n;
  quiz.dataset.player = n;
  for (const i of [1, 2]) {
    const player = players[i];
    const active = i === n;
    const label = i === 1 ? "اللاعب الأول" : "اللاعب الثاني";
    player.card.setAttribute("aria-label", `${label}، ${player.name}${active ? "، دوره توّا" : ""}`);
    if (active) player.card.setAttribute("aria-current", "true");
    else player.card.removeAttribute("aria-current");
  }
}

// pick the next player and question, or finish after ten turns
function newQuestion() {
  if (gameOver) return;
  updateProgress(turnsPlayed);
  if (turnsPlayed >= TOTAL_TURNS || queue.length === 0) {
    finishGame();
    return;
  }
  setActivePlayer(turnsPlayed % 2 === 0 ? 1 : 2);
  showQuestion(queue.pop());
}

// count this turn and move on to the other player
function advance() {
  if (gameOver) return;
  turnsPlayed++;
  newQuestion();
}

// skip this turn without adding any points
function skipQuestion() {
  if (gameOver || questionEnded) return;
  questionEnded = true;
  advance();
}

// move on after an answer, counting the turn only once
function nextQuestion() {
  if (gameOver || !questionEnded) return;
  questionEnded = false;
  advance();
}

// save both scores once and open the results page
function finishGame() {
  if (gameOver) return;
  gameOver = true;
  saveTopScores("versusBestScores", [1, 2].map((n) => ({
    name: players[n].name,
    score: players[n].score,
    date: new Date().toLocaleDateString(),
  })));
  sessionStorage.setItem("versusResult", JSON.stringify({
    player1: { name: players[1].name, score: players[1].score },
    player2: { name: players[2].name, score: players[2].score },
  }));
  window.location.href = "versus-results.html";
}

bindQuizControls();
if (readPlayers()) loadQuestions(TOTAL_TURNS);
