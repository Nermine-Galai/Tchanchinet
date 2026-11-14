<?php

session_start();
require_once "connexion.php";

header("Content-Type: application/json; charset=UTF-8");

// 1. Verify the HTTP method
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Méthode non autorisée"]);
    exit;
}

// 2. Retrieve submitted data
$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);
$answer = trim($_POST["answer"] ?? "");

if (!$id || $answer === "") {
    http_response_code(400);
    echo json_encode(["error" => "Données invalides"]);
    exit;
}

// 3. Verify that a question has been started
if (!isset($_SESSION["question"])) {
    http_response_code(400);
    echo json_encode(["error" => "Aucune question commencée"]);
    exit;
}

$current = &$_SESSION["question"];

// 4. Verify the current question ID
if ($current["id"] !== $id) {
    http_response_code(400);
    echo json_encode(["error" => "Question incorrecte"]);
    exit;
}

try {

    // 5. Retrieve the answer and question type from MySQL
    $stmt = $pdo->prepare(
        "SELECT answer, type FROM questions WHERE id = ?"
    );

    $stmt->execute([$id]);
    $question = $stmt->fetch();

    if (!$question) {
        http_response_code(404);
        echo json_encode(["error" => "Question introuvable"]);
        exit;
    }

    // 6. Determine the maximum number of attempts
    $maxAttempts = ($question["type"] === "qcm") ? 1 : 3;

    // 7. Prevent additional attempts
    if ($current["finished"] || $current["attempts"] >= $maxAttempts) {
        http_response_code(400);
        echo json_encode(["error" => "Question déjà terminée"]);
        exit;
    }

    // 8. Retrieve accepted answers
    $acceptedAnswers = explode("|", $question["answer"]);

    // 9. Normalize answers
    $normalize = function ($text) {
        $text = trim($text);
        $text = preg_replace('/\s+/u', ' ', $text);

        return function_exists("mb_strtolower")
            ? mb_strtolower($text, "UTF-8")
            : strtolower($text);
    };

    // 10. Check the player's answer
    $playerAnswer = $normalize($answer);
    $correct = false;

    foreach ($acceptedAnswers as $accepted) {
        if ($playerAnswer === $normalize($accepted)) {
            $correct = true;
            break;
        }
    }

    // 11. Update attempts and elapsed time
    $current["attempts"]++;

    $attempts = $current["attempts"];
    $elapsed = time() - $current["start_time"];

    $points = 0;

    // 12. Calculate points for a correct answer
    if ($correct) {

        if ($current["hint_used"]) {
            $basePoints = 25;
        } else {
            $pointsByAttempt = [100, 80, 50];
            $basePoints = $pointsByAttempt[$attempts - 1];
        }

        // 5 points deducted every 10 seconds, maximum 25
        $penalty = min(
            floor($elapsed / 10) * 5,
            25
        );

        $points = max(0, $basePoints - $penalty);
        $current["finished"] = true;

    } elseif ($attempts >= $maxAttempts) {

        // No attempts remaining
        $current["finished"] = true;
    }

    // 13. Prepare the response
    $result = [
        "correct" => $correct,
        "points" => $points,
        "attempts" => $attempts,
        "attempts_left" => $maxAttempts - $attempts,
        "max_attempts" => $maxAttempts,
        "finished" => $current["finished"],
        "elapsed" => $elapsed
    ];

    // Reveal the correct answer only when the question is finished
    if ($current["finished"]) {
        $result["bonne_reponse"] = $acceptedAnswers[0];
    }

    echo json_encode($result, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "error" => "Erreur lors de la vérification de la réponse."
    ]);
}