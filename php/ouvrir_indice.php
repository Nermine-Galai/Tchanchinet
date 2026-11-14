<?php

session_start();
require_once "connexion.php";

header("Content-Type: application/json; charset=UTF-8");

// 1. Accept only POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Méthode non autorisée"]);
    exit;
}

// 2. Retrieve question ID
$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);

if (!$id) {
    http_response_code(400);
    echo json_encode(["error" => "ID invalide"]);
    exit;
}

// 3. Check the current question session
if (!isset($_SESSION["question"])) {
    http_response_code(400);
    echo json_encode(["error" => "Aucune question commencée"]);
    exit;
}

$current = &$_SESSION["question"];

// 4. Verify question ID
if ($current["id"] !== $id) {
    http_response_code(400);
    echo json_encode(["error" => "Question incorrecte"]);
    exit;
}

// 5. Check whether the question is finished
if ($current["finished"]) {
    http_response_code(400);
    echo json_encode(["error" => "Question déjà terminée"]);
    exit;
}

// Prevent using the same hint more than once
if ($current["hint_used"]) {
    http_response_code(400);
    echo json_encode(["error" => "Indice déjà utilisé"]);
    exit;
}

// 6. Check whether two incorrect attempts have been made
if ($current["attempts"] < 2) {
    http_response_code(403);
    echo json_encode([
        "error" => "L'indice sera disponible après deux mauvaises réponses."
    ]);
    exit;
}

// 7. Retrieve the hint from MySQL
$stmt = $pdo->prepare(
    "SELECT hint, type FROM questions WHERE id = ?"
);

$stmt->execute([$id]);

$question = $stmt->fetch();

if (!$question) {
    http_response_code(404);
    echo json_encode(["error" => "Question introuvable"]);
    exit;
}

// 8. QCM questions do not use hints
if ($question["type"] === "qcm") {
    http_response_code(403);
    echo json_encode(["error" => "Indice indisponible pour cette question"]);
    exit;
}

// 9. Mark the hint as used
$current["hint_used"] = true;

// 10. Return the hint
echo json_encode([
    "success" => true,
    "hint" => $question["hint"]
], JSON_UNESCAPED_UNICODE);
