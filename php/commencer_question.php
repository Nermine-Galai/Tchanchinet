<?php

session_start();

require_once "connexion.php";

header("Content-Type: application/json; charset=UTF-8");

// Accept only POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Méthode non autorisée"]);
    exit;
}

// Retrieve the question ID
$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);

if (!$id) {
    http_response_code(400);
    echo json_encode(["error" => "ID de question invalide"]);
    exit;
}

// Verify that the question exists
$stmt = $pdo->prepare(
    "SELECT id FROM questions WHERE id = ?"
);

$stmt->execute([$id]);

if (!$stmt->fetch()) {
    http_response_code(404);
    echo json_encode(["error" => "Question introuvable"]);
    exit;
}

// Initialize the question session
$_SESSION["question"] = [
    "id" => $id,
    "start_time" => time(),
    "attempts" => 0,
    "hint_used" => false,
    "finished" => false
];

// Send confirmation
echo json_encode([
    "success" => true,
    "message" => "Question commencée",
    "question_id" => $id
], JSON_UNESCAPED_UNICODE);
