<?php
// called by javascript when a question appears: the server notes the start time
session_start();

if (isset($_POST['id'])) {
    $_SESSION['question_id'] = $_POST['id'];
    $_SESSION['debut'] = time();     // server time, in seconds
    $_SESSION['essais'] = 0;         // number of answers already sent
    $_SESSION['indice'] = 0;         // 1 when the player opens the hint
    $_SESSION['fini'] = 0;           // 1 when the question is finished
}

echo json_encode(array("ok" => isset($_POST['id'])));
?>