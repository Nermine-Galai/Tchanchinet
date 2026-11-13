<?php
// envoie les questions au JavaScript en JSON, sans les réponses
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
    // les 4 options d'un QCM sont dans une seule case, séparées par |
    if ($ligne['type'] == "qcm") {
        $question["options"] = explode("|", $ligne['options']);
    }
    $questions[] = $question;
}

echo json_encode($questions);
?>
