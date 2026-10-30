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

    // Retrieve both players' scores.
    const s1 = Number(data.player1.score) || 0;
    const s2 = Number(data.player2.score) || 0;

    // Display player names.
    document.getElementById("player-one-result-name").textContent = data.player1.name;
    document.getElementById("player-two-result-name").textContent = data.player2.name;

    document.getElementById("winner-one-name").textContent = data.player1.name;
    document.getElementById("winner-two-name").textContent = data.player2.name;

    // Display final scores.
    document.getElementById("player-one-final-score").textContent = s1;
    document.getElementById("player-two-final-score").textContent = s2;

    // Determine the winner.
    root.dataset.winner = s1 === s2 ? "draw" : s1 > s2 ? "1" : "2";


    // Retrieve the leaderboard from localStorage.
    const bestScores = JSON.parse(
        localStorage.getItem("versusBestScores") || "[]"
    );

    const leaderboard = document.getElementById("versus-best-scores");

    // Display the top 5 scores.
    bestScores.forEach((entry, index) => {
        const li = document.createElement("li");

        const rank = document.createElement("span");
        rank.className = "versus-rank";
        rank.textContent = `#${index + 1}`;

        const name = document.createElement("span");
        name.className = "versus-player-name";
        name.textContent = entry.name;

        const points = document.createElement("span");
        points.className = "versus-points";
        points.textContent = `${entry.score} نقطة`;

        const date = document.createElement("span");
        date.className = "versus-date";
        date.textContent = entry.date;

        li.append(rank, name, points, date);

        leaderboard.appendChild(li);
    });

    // No saved scores.
    if (bestScores.length === 0) {
        leaderboard.textContent = "ما فماش نتائج مسجّلة.";
    }

})();