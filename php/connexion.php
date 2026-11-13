<?php
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
