<?php
require_once "connexion.php";

header("Content-Type: application/json; charset=UTF-8");

$mode = $_GET["mode"] ?? "";

if (!in_array($mode, ["solo", "versus"])) {
    http_response_code(400);
    echo json_encode(["error" => "Mode invalide"]);
    exit;
}

$stmt = $pdo->prepare(
    "SELECT player_name AS name, score,
            DATE_FORMAT(created_at, '%d/%m/%Y') AS date
     FROM scores
     WHERE game_mode = ?
     ORDER BY score DESC, created_at ASC
     LIMIT 5"
);

$stmt->execute([$mode]);

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE);
