<?php
<<<<<<< HEAD
// connexion à la base MySQL (créez d'abord la base « tchanchinet » avec phpMyAdmin)
$servername = "localhost";
$database = "tchanchinet";
$username = "root";
$password = "";   // vide avec XAMPP, à adapter à votre installation

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erreur de connexion : " . $e->getMessage());
}
?>
=======

$host = "localhost";
$dbname = "tchanchinet";
$username = "root";
$password = "";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    die("Erreur de connexion à la base de données : " . $e->getMessage());
}

>>>>>>> ff6b9094a88b1d5cbcb1c212a203626913816f4b
