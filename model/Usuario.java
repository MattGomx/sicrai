package model;

public class Usuario {

    private int id;
    private String nome;
    private String email;
    private String senha;
    private int pontos;

    public Aluno(String nome, String email, String senha, int pontos) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.pontos = pontos;
    }
}
