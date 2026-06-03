<?php

session_start();

if(!isset($_SESSION['id'])){
    header("Location: login.html");
    exit;
}
?>

<h1>
Bem-vindo,
<?php echo $_SESSION['nome']; ?>
</h1>

<a href="php/logout.php">
Sair
</a>