<?php

require_once "connexion.php";

$jsonFile = __DIR__ . "/../assets/tunisian_riddles_40.json";

// Verify that the JSON file exists
if (!file_exists($jsonFile)) {
    die("Erreur : fichier JSON introuvable.");
}

// Read and decode JSON
$jsonData = file_get_contents($jsonFile);
$questions = json_decode($jsonData, true);

if ($questions === null) {
    die("Erreur lors de la lecture du fichier JSON.");
}

// Create the questions table
$sql = "CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    question TEXT NOT NULL,
    hint TEXT,
    answer TEXT NOT NULL,
    options TEXT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";

$pdo->exec($sql);

// Avoid importing the same questions twice
$count = $pdo->query("SELECT COUNT(*) FROM questions")->fetchColumn();

if ($count > 0) {
    die("La table contient déjà des questions. Importation annulée.");
}

// Prepare insertion
$insert = $pdo->prepare("
    INSERT INTO questions (type, question, hint, answer, options)
    VALUES (:type, :question, :hint, :answer, :options)
");

try {
    $pdo->beginTransaction();

    foreach ($questions as $q) {

        // Convert accepted answers into a single string
        $answers = $q["answer"];

        if (is_array($answers)) {
            $answers = implode("|", $answers);
        }

        // Convert QCM options into a single string
        $options = "";

        if (isset($q["options"]) && is_array($q["options"])) {
            $options = implode("|", $q["options"]);
        }

        $insert->execute([
            ":type" => $q["type"],
            ":question" => $q["question"],
            ":hint" => $q["hint"] ?? "",
            ":answer" => $answers,
            ":options" => $options
        ]);
    }

    $pdo->commit();

    echo "Importation réussie !<br>";
    echo "Nombre de questions importées : " . count($questions);

} catch (Exception $e) {

    $pdo->rollBack();

    die("Erreur pendant l'importation : " . $e->getMessage());
}
