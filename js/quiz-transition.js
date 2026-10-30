let questionSliding = false;

async function slideQuestion(changeQuestion) {
  if (questionSliding) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    changeQuestion();
    return;
  }

  const main = document.getElementById("main");
  const parts = document.querySelectorAll(".question-panel, .answer-form, .qcm-options");
  const slide = (frames) => Promise.all(Array.from(parts, (part) =>
    part.animate(frames, { duration: 150, easing: "ease-in-out" }).finished
  ));

  questionSliding = true;
  main.inert = true;
  try {
    await slide([
      { transform: "translateX(0)", opacity: 1 },
      { transform: "translateX(-80px)", opacity: 0 }
    ]);
    changeQuestion();
    await slide([
      { transform: "translateX(80px)", opacity: 0 },
      { transform: "translateX(0)", opacity: 1 }
    ]);
  } finally {
    main.inert = false;
    questionSliding = false;
  }

  const selector = document.getElementById("quiz").dataset.type === "qcm"
    ? ".qcm-option" : "#answer";
  main.querySelector(selector).focus();
}
