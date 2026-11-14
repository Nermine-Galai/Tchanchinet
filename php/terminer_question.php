<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Méthode non autorisée."]);
    exit;
}

if (!isset($_SESSION["question"])) {
    http_response_code(400);
    echo json_encode(["error" => "Aucune question active."]);
    exit;
}

if ($_SESSION["question"]["finished"]) {
    echo json_encode(["success" => true]);
    exit;
}

// Mark the current question as abandoned
$_SESSION["question"]["finished"] = true;

echo json_encode(["success" => true]);
