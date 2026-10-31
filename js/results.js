// show the solo result and the saved best scores
(function showSoloResults() {
  const raw = sessionStorage.getItem("soloScore");
  if (raw === null) {
    window.location.replace("../index.html");
    return;
  }

  const score = Number(raw) || 0;
  const reason = sessionStorage.getItem("soloFinishReason");
  document.getElementById("final-score").textContent = score;
  document.querySelector(".final-score").setAttribute("aria-label", `${score} نقطة`);

  const title = document.getElementById("result-title");
  const message = document.getElementById("result-message");
  if (reason === "time") {
    title.textContent = "وفّى الوقت!";
    message.textContent = "هذا مجموع نقاطك قبل ما يوفّى الوقت";
  } else if (reason === "complete") {
    title.textContent = "يعطيك الصحة!";
    message.textContent = "كمّلت التشنشينات الكل!";
  }

  renderLeaderboard("best-scores-list", "soloBestScores");
})();
