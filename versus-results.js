(function () {
  const root = document.getElementById("versus-result");
  let data = null;

  try {
    data = JSON.parse(sessionStorage.getItem("versusResult"));
  } catch (e) {
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

  root.dataset.winner = s1 === s2 ? "draw" : s1 > s2 ? "1" : "2";
})();
