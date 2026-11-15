<?php
// connection to the mysql database (first create the "tchanchinet" database with phpMyAdmin)
$servername = "localhost";
$database = "tchanchinet";
$username = "root";
$password = "";   // empty with XAMPP, change it for your installation

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$database;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Erreur de connexion : " . $e->getMessage());
}
?>