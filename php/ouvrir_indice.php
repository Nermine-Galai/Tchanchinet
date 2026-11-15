<?php
// called by javascript when the player opens the hint: the server remembers it
session_start();

$ouvert = false;

// the hint opens only after 2 wrong answers
if (isset($_SESSION['essais']) && $_SESSION['essais'] == 2 && $_SESSION['fini'] == 0) {
    $_SESSION['indice'] = 1;
    $ouvert = true;
}

echo json_encode(array("ok" => $ouvert));
?>