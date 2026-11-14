<?php

require_once "connexion.php";

header("Content-Type: application/json; charset=UTF-8");

// Retrieve questions without exposing answers or hints
try {

    $stmt = $pdo->query(
        "SELECT id, type, question, options FROM questions"
    );

    $questions = $stmt->fetchAll();

    foreach ($questions as &$question) {

        if ($question["type"] === "qcm" && !empty($question["options"])) {
            $question["options"] = explode("|", $question["options"]);
        } else {
            $question["options"] = [];
        }
    }

    unset($question);

    echo json_encode($questions, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "error" => "Impossible de récupérer les questions."
    ]);
}