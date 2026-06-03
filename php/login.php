<?php

session_start();

include("conexao.php");

$email = $_POST['email'];
$senha = $_POST['senha'];

$sql = "SELECT * FROM usuarios
WHERE email='$email'";

$resultado = $conexao->query($sql);

if($resultado->num_rows > 0){

    $usuario = $resultado->fetch_assoc();

    if(
        password_verify(
            $senha,
            $usuario['senha']
        )
    ){

        $_SESSION['id'] = $usuario['id'];
        $_SESSION['nome'] = $usuario['nome'];

        header("Location: ../dashboard.php");

    }else{

        echo "Senha incorreta";

    }

}else{

    echo "Usuário não encontrado";

}
?>