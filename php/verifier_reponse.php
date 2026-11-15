<?php
// receives an answer from javascript, checks it in the database and calculates the points on the server
session_start();
include('connexion.php');

$resultat = array("correct" => false, "points" => 0, "bonne_reponse" => "");

// the current question is the one the server noted in the session
if (isset($_POST['id']) && isset($_POST['reponse']) && isset($_SESSION['question_id'])
    && $_POST['id'] == $_SESSION['question_id'] && $_SESSION['fini'] == 0) {
    $reponse = trim($_POST['reponse']);

    $req = $pdo->prepare("SELECT type, answer FROM questions WHERE id = :id");
    $req->execute(array("id" => $_SESSION['question_id']));
    $lignes = $req->fetchAll(PDO::FETCH_ASSOC);

    if (count($lignes) == 1) {
        $type = $lignes[0]['type'];
        // the accepted spellings are in one cell, separated by |
        $reponses = explode("|", $lignes[0]['answer']);

        // the server counts the attempts itself: 1, 2 or 3
        $_SESSION['essais'] = $_SESSION['essais'] + 1;
        $essai = $_SESSION['essais'];

        foreach ($reponses as $bonne) {
            if ($reponse == $bonne) {
                $resultat["correct"] = true;
            }
        }

        if ($resultat["correct"]) {
            // fewer points at each attempt, and only 25 with the hint
            $points_par_essai = array(100, 80, 50);
            if ($_SESSION['indice'] == 1) {
                $points = 25;
            } else {
                $points = $points_par_essai[$essai - 1];
            }

            // time penalty: 5 points per full 10 seconds, 25 at most
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

        // the question is finished: right answer, 3rd attempt, or qcm (one choice only)
        if ($resultat["correct"] || $essai == 3 || $type == "qcm") {
            $_SESSION['fini'] = 1;
            $resultat["bonne_reponse"] = $reponses[0];
        }
    }
}

echo json_encode($resultat);
?>