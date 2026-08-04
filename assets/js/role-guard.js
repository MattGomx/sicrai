/* =====================================================================
   SICRAI - CONTROLE DE ACESSO POR NÍVEL (role-guard.js)
   Requer que "assets/js/supabase.js" já tenha sido carregado antes
   (precisa da variável global "client").
===================================================================== */

// Busca o perfil do usuário logado, incluindo o "role"
async function obterPerfilComRole(userId) {

    const { data, error } = await client
        .from("perfis")
        .select("nome, pontos, latinhas, role")
        .eq("id", userId)
        .single();

    if (error || !data) {
        return { nome: null, pontos: 0, latinhas: 0, role: "usuario" };
    }

    return { ...data, role: data.role || "usuario" };
}

// Página inicial de cada papel
function paginaInicialPorRole(role) {
    if (role === "admin") return "admin.html";
    if (role === "catador") return "maquinas.html";
    return "dashboard.html";
}

// Garante que existe sessão E que o role está entre os permitidos.
// Use no topo de páginas restritas, ex:
//   const acesso = await protegerPagina(["admin"]);
//   if (!acesso) return; // já foi redirecionado
async function protegerPagina(rolesPermitidos) {

    const { data: { session } } = await client.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
        return null;
    }

    const perfil = await obterPerfilComRole(session.user.id);

    if (!rolesPermitidos.includes(perfil.role)) {
        window.location.href = paginaInicialPorRole(perfil.role);
        return null;
    }

    return { session, perfil };
}
