// show both scores, who won or if it was a draw, and the best scores
(function showVersusResults() {
  let data = null;
  try {
    data = JSON.parse(sessionStorage.getItem("versusResult"));
  } catch {
    data = null;
  }
  if (!data || !data.player1 || !data.player2) {
    window.location.replace("versus.html");
    return;
  }

  const s1 = Number(data.player1.score) || 0;
  const s2 = Number(data.player2.score) || 0;
  document.getElementById("player-one-result-name").textContent = data.player1.name;
  document.getElementById("player-two-result-name").textContent = data.player2.name;
  document.getElementById("winner-one-name").textContent = data.player1.name;
  document.getElementById("winner-two-name").textContent = data.player2.name;
  document.getElementById("player-one-final-score").textContent = s1;
  document.getElementById("player-two-final-score").textContent = s2;
  document.getElementById("versus-result").dataset.winner = s1 === s2 ? "draw" : s1 > s2 ? "1" : "2";
  renderLeaderboard("versus-best-scores", "versusBestScores", true);
})();
