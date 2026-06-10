package controller;

import dao.UsuarioDAO;
import model.Usuario;
import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;

@WebServlet("/cadastro")
public class UsuarioController extends HttpServlet{

    /*private UsuarioDAO usuarioDAO;

    public UsuarioController() {
        this.usuarioController = new UsuarioController();
    }

    public int cadastrarUsuario(Usuario user) {
        Usuario usuario = user;

        int id = UsuarioDAO.insertUsuario(usuario);
        return id;
    }**/


    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String nome = request.getParameter("nome");
        String email = request.getParameter("email");
        String senha = request.getParameter("senha");

        Usuario usuario = new Usuario(nome, email, senha);

        UsuarioDAO dao = new UsuarioDAO();
        dao.cadastrarUsuario(usuario);

        response.sendRedirect("login.html");
    }

}