// get the saved scores for this mode; each mode has a seperate list
function readTopScores(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

// add the new scores, sort them and keep the best five
function saveTopScores(key, entries) {
  const scores = [...readTopScores(key), ...entries];
  scores.sort((a, b) => b.score - a.score);
  localStorage.setItem(key, JSON.stringify(scores.slice(0, 5)));
}

// make one text cell with the class used by the stylesheet
function createScoreCell(text, className) {
  const cell = document.createElement("span");
  cell.className = className;
  cell.textContent = text;
  return cell;
}

// show the saved ranks, points and dates, plus names in versus mode
function renderLeaderboard(listId, key, withNames = false) {
  const scores = readTopScores(key);
  const list = document.getElementById(listId);
  const prefix = withNames ? "versus" : "score";
  list.replaceChildren();
  if (scores.length === 0) {
    list.textContent = "ما فماش نتائج مسجّلة.";
    return;
  }
  scores.forEach((entry, index) => {
    const row = document.createElement("li");
    row.appendChild(createScoreCell(`#${index + 1}`, `${prefix}-rank`));
    if (withNames) row.appendChild(createScoreCell(entry.name, "versus-player-name"));
    row.append(
      createScoreCell(`${entry.score} نقطة`, `${prefix}-points`),
      createScoreCell(entry.date, `${prefix}-date`)
    );
    list.appendChild(row);
  });
}
