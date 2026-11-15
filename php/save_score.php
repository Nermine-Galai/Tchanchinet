<?php
session_start();
require_once "connexion.php";

header("Content-Type: application/json; charset=UTF-8");

$data = json_decode(file_get_contents("php://input"), true);

$mode = $data["mode"] ?? "";
$score = $data["score"] ?? null;
$name = $data["name"] ?? null;

if (!in_array($mode, ["solo", "versus"]) || !is_numeric($score) || $score < 0) {
    http_response_code(400);
    echo json_encode(["error" => "Données invalides"]);
    exit;
}

if ($mode === "solo") {
    $name = null;
} elseif (empty(trim($name ?? ""))) {
    http_response_code(400);
    echo json_encode(["error" => "Nom du joueur manquant"]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "INSERT INTO scores (game_mode, player_name, score)
         VALUES (?, ?, ?)"
    );

    $stmt->execute([$mode, $name, (int)$score]);

    echo json_encode(["success" => true]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erreur lors de l'enregistrement"]);
}
