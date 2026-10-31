let questionSliding = false;

// unlock the buttons and focus the answer once the slide is done
function finishQuestionSlide() {
  const main = document.getElementById("main");
  const quizBox = document.getElementById("quiz");
  quizBox.removeAttribute("data-transition");
  main.inert = false;
  questionSliding = false;

  if (quizBox.dataset.type === "qcm") {
    document.querySelector(".qcm-option").focus();
  } else {
    document.getElementById("answer").focus();
  }
}

// slide the old question left, then bring the next one in from the right
function slideQuestion(changeQuestion) {
  if (questionSliding) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    changeQuestion();
    return;
  }

  const main = document.getElementById("main");
  const quizBox = document.getElementById("quiz");
  questionSliding = true;
  main.inert = true;
  quizBox.dataset.transition = "out";

  // let the old question leave before changing what is on screen
  setTimeout(function () {
    try {
      changeQuestion();
    } catch (error) {
      finishQuestionSlide();
      throw error;
    }

    quizBox.dataset.transition = "in";
    setTimeout(finishQuestionSlide, 150);
  }, 150);
}
