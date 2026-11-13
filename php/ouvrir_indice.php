<?php
// appelé par le JavaScript quand le joueur ouvre l'indice : le serveur s'en souvient
session_start();

$ouvert = false;

// l'indice s'ouvre seulement après 2 mauvaises réponses
if (isset($_SESSION['essais']) && $_SESSION['essais'] == 2 && $_SESSION['fini'] == 0) {
    $_SESSION['indice'] = 1;
    $ouvert = true;
}

echo json_encode(array("ok" => $ouvert));
?>
