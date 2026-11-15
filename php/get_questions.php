<?php
// sends the questions to javascript as json, without the answers
include('connexion.php');

$req = $pdo->query("SELECT id, type, question, hint, options FROM questions");
$lignes = $req->fetchAll(PDO::FETCH_ASSOC);

$questions = array();
foreach ($lignes as $ligne) {
    $question = array(
        "id" => $ligne['id'],
        "type" => $ligne['type'],
        "question" => $ligne['question'],
        "hint" => $ligne['hint']
    );
    // the 4 options of a qcm are in one cell, separated by |
    if ($ligne['type'] == "qcm") {
        $question["options"] = explode("|", $ligne['options']);
    }
    $questions[] = $question;
}

echo json_encode($questions);
?>