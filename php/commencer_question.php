<?php
// appelé par le JavaScript quand une question s'affiche : le serveur note l'heure de départ
session_start();

if (isset($_POST['id'])) {
    $_SESSION['question_id'] = $_POST['id'];
    $_SESSION['debut'] = time();     // l'heure du serveur, en secondes
    $_SESSION['essais'] = 0;         // nombre de réponses déjà envoyées
    $_SESSION['indice'] = 0;         // 1 quand le joueur ouvre l'indice
    $_SESSION['fini'] = 0;           // 1 quand la question est terminée
}

echo json_encode(array("ok" => isset($_POST['id'])));
?>
