<?php
// open this page once: it creates the "scores" table used by save_score.php and get_scores.php
include('connexion.php');

// game_mode: solo or versus   player_name: empty (NULL) in solo mode
// created_at: filled by mysql with the date and time when the score is saved
$pdo->exec("CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_mode ENUM('solo', 'versus') NOT NULL,
    player_name VARCHAR(100) DEFAULT NULL,
    score INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// count the scores already saved, to show that the table is ready
$req = $pdo->query("SELECT id FROM scores");
$lignes = $req->fetchAll(PDO::FETCH_ASSOC);

echo "Table scores prête : elle contient " . count($lignes) . " scores.";
?>
