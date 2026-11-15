<?php
<<<<<<< HEAD
// reçoit une réponse du JavaScript, la vérifie dans la base et calcule les points côté serveur
session_start();
include('connexion.php');

$resultat = array("correct" => false, "points" => 0, "bonne_reponse" => "");

// la question en cours est celle que le serveur a notée dans la session
if (isset($_POST['id']) && isset($_POST['reponse']) && isset($_SESSION['question_id'])
    && $_POST['id'] == $_SESSION['question_id'] && $_SESSION['fini'] == 0) {
    $reponse = trim($_POST['reponse']);

    $req = $pdo->prepare("SELECT type, answer FROM questions WHERE id = :id");
    $req->execute(array("id" => $_SESSION['question_id']));
    $lignes = $req->fetchAll(PDO::FETCH_ASSOC);

    if (count($lignes) == 1) {
        $type = $lignes[0]['type'];
        // les écritures acceptées sont dans une seule case, séparées par |
        $reponses = explode("|", $lignes[0]['answer']);

        // c'est le serveur qui compte les essais : 1, 2 ou 3
        $_SESSION['essais'] = $_SESSION['essais'] + 1;
        $essai = $_SESSION['essais'];

        foreach ($reponses as $bonne) {
            if ($reponse == $bonne) {
                $resultat["correct"] = true;
            }
        }

        if ($resultat["correct"]) {
            // moins de points à chaque essai, et 25 seulement avec l'indice
            $points_par_essai = array(100, 80, 50);
            if ($_SESSION['indice'] == 1) {
                $points = 25;
            } else {
                $points = $points_par_essai[$essai - 1];
            }

            // pénalité de temps : 5 points par 10 secondes complètes, 25 au maximum
            $secondes = time() - $_SESSION['debut'];
            $penalite = floor($secondes / 10) * 5;
            if ($penalite > 25) {
                $penalite = 25;
            }

            $points = $points - $penalite;
            if ($points < 0) {
                $points = 0;
            }
            $resultat["points"] = $points;
        }

        // la question est finie : bonne réponse, 3e essai, ou QCM (un seul choix)
        if ($resultat["correct"] || $essai == 3 || $type == "qcm") {
            $_SESSION['fini'] = 1;
            $resultat["bonne_reponse"] = $reponses[0];
        }
    }
}

echo json_encode($resultat);
?>
=======

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
>>>>>>> ff6b9094a88b1d5cbcb1c212a203626913816f4b
