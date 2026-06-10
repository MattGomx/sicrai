package model;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import javax.swing.JOptionPane;

public class Conexao {

    public Connection obterConexao() {
        try {
            Class.forName("org.postgresql.Driver");
            String url = "jdbc:postgresql://10.90.24.54/ra0081825"; //Em casa: 200.18.128.54
            String usuario = "ra0081825", senha = "_P12f05_";
            Connection c = DriverManager.getConnection(url, usuario, senha);         
            return c;
        } catch (ClassNotFoundException | SQLException ex) {
            JOptionPane.showMessageDialog(null, ex.getMessage(), "Erro de conexão", JOptionPane.ERROR_MESSAGE);
        }
        return null;
    }
}