<?php

include("conexao.php");

$nome = $_POST['nome'];
$email = $_POST['email'];

$senha = password_hash(
    $_POST['senha'],
    PASSWORD_DEFAULT
);

$sql = "INSERT INTO usuarios(nome,email,senha)
VALUES('$nome','$email','$senha')";

if($conexao->query($sql)){
    header("Location: ../login.html");
}else{
    echo "Erro ao cadastrar";
}
?>