/* =====================================================================
   SICRAI - AJUSTA A SIDEBAR CONFORME O NÍVEL DE ACESSO
   Inclua DEPOIS de supabase.js e role-guard.js em cada página do dashboard.

   Correções desta versão:
   - Esconde o menu até saber o role certo (evita "flash" da versão errada)
   - Guarda o role em sessionStorage para aplicar instantaneamente
     nas próximas páginas da mesma sessão, sem esperar a rede
===================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    if (typeof client === "undefined") return;

    const nav = document.querySelector(".sidebar nav");
    if (!nav) return;

    const logoutLink = document.getElementById("logoutBtn");

    const escondidosParaCatador = [
        "dashboard.html",
        "reciclagens.html",
        "recompensas-dashboard.html",
        "ranking.html"
    ];

    // Esconde o menu enquanto não sabemos o role certo,
    // pra não piscar a versão errada na tela
    nav.style.visibility = "hidden";

    function aplicarRoleNoMenu(role) {

        // Mostra/esconde os links de usuário padrão
        nav.querySelectorAll("a").forEach(a => {
            const href = a.getAttribute("href");
            if (!escondidosParaCatador.includes(href)) return;
            a.style.display = (role === "catador") ? "none" : "";
        });

        // Link "Máquinas" para catador e admin
        if (role === "catador" || role === "admin") {
            if (!nav.querySelector('a[href="maquinas.html"]')) {
                const link = document.createElement("a");
                link.href = "maquinas.html";
                link.innerHTML = `<i class="fa-solid fa-industry"></i><span class="link-text">Máquinas</span>`;
                if (window.location.pathname.toLowerCase().endsWith("maquinas.html")) {
                    link.classList.add("active");
                }
                nav.insertBefore(link, logoutLink);
            }
        }

        // Link "Administração" só para admin
        if (role === "admin") {
            if (!nav.querySelector('a[href="admin.html"]')) {
                const link = document.createElement("a");
                link.href = "admin.html";
                link.innerHTML = `<i class="fa-solid fa-user-shield"></i><span class="link-text">Administração</span>`;
                if (window.location.pathname.toLowerCase().endsWith("admin.html")) {
                    link.classList.add("active");
                }
                nav.insertBefore(link, logoutLink);
            }
        }

        nav.style.visibility = "visible";

        // Avisa o sidebar-toggle.js que a lista de links mudou,
        // pra ele recalcular a posição do indicador de item ativo
        document.dispatchEvent(new CustomEvent("sidebarLinksAtualizados"));
    }

    // 1) Aplica IMEDIATAMENTE usando o role guardado em cache
    //    (evita esperar a rede nas navegações seguintes)
    const roleCache = sessionStorage.getItem("sicraiRole");
    if (roleCache) {
        aplicarRoleNoMenu(roleCache);
    }

    // 2) Confirma com o servidor (obrigatório, pois o cache pode
    //    estar desatualizado ou não existir ainda nesta sessão)
    const { data: { session } } = await client.auth.getSession();

    if (!session) {
        nav.style.visibility = "visible";
        return;
    }

    const perfil = await obterPerfilComRole(session.user.id);
    const role = perfil.role;

    sessionStorage.setItem("sicraiRole", role);

    // Reaplica com o role confirmado (corrige silenciosamente
    // se o cache estivesse errado ou ausente)
    aplicarRoleNoMenu(role);

});