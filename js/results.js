(function () {
    const raw = sessionStorage.getItem("soloScore");

    // Opened directly without a finished game: go back home.
    if (raw === null) {
        window.location.replace("../index.html");
        return;
    }

    const score = Number(raw) || 0;
    const reason = sessionStorage.getItem("soloFinishReason");

    // Display the current score.
    document.getElementById("final-score").textContent = score;

    document.querySelector(".final-score")
        .setAttribute("aria-label", `${score} نقطة`);

    const title = document.getElementById("result-title");
    const message = document.getElementById("result-message");

    if (reason === "time") {
        title.textContent = "وفّى الوقت!";
        message.textContent = "هذا مجموع نقاطك قبل ما يوفّى الوقت";
    } else if (reason === "complete") {
        title.textContent = "يعطيك الصحة!";
        message.textContent = "كمّلت التشنشينات الكل!";
    }

    // Retrieve the best scores from localStorage.
    const bestScores = JSON.parse(
        localStorage.getItem("soloBestScores") || "[]"
    );

    const leaderboard = document.getElementById("best-scores-list");

    // Display the top 5 scores.
    bestScores.forEach((entry, index) => {
        const li = document.createElement("li");

        const rank = document.createElement("span");
        rank.className = "score-rank";
        rank.textContent = `#${index + 1}`;

        const points = document.createElement("span");
        points.className = "score-points";
        points.textContent = `${entry.score} نقطة`;

        const date = document.createElement("span");
        date.className = "score-date";
        date.textContent = entry.date;

        li.append(rank, points, date);

        leaderboard.appendChild(li);
    });

    // Display a message if there are no saved scores.
    if (bestScores.length === 0) {
        leaderboard.textContent = "ما فماش نتائج مسجّلة.";
    }
})();