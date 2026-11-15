// make one text cell with the class used by the stylesheet
function createScoreCell(text, className) {
  const cell = document.createElement("span");
  cell.className = className;
  cell.textContent = text;
  return cell;
}

// Load the top five scores from MySQL through PHP
async function renderLeaderboard(listId, mode, withNames = false) {
  const list = document.getElementById(listId);
  const prefix = withNames ? "versus" : "score";

  list.textContent = "جاري تحميل النتائج...";

  try {
    const response = await fetch(`../php/get_scores.php?mode=${mode}`);

    if (!response.ok) {
      throw new Error("Failed to load scores");
    }

    const scores = await response.json();
    list.replaceChildren();

    if (scores.length === 0) {
      list.textContent = "ما فماش نتائج مسجّلة.";
      return;
    }

    scores.forEach((entry, index) => {
      const row = document.createElement("li");

      row.appendChild(
        createScoreCell(`#${index + 1}`, `${prefix}-rank`)
      );

      if (withNames) {
        row.appendChild(
          createScoreCell(entry.name, "versus-player-name")
        );
      }

      row.append(
        createScoreCell(`${entry.score} نقطة`, `${prefix}-points`),
        createScoreCell(entry.date, `${prefix}-date`)
      );

      list.appendChild(row);
    });

  } catch (error) {
    console.error(error);
    list.textContent = "تعذّر تحميل النتائج.";
  }
}
