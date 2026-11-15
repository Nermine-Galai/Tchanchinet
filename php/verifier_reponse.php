<?php
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