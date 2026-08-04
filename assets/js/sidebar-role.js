/* =====================================================================
   SICRAI - AJUSTA A SIDEBAR CONFORME O NÍVEL DE ACESSO
   Inclua DEPOIS de supabase.js e role-guard.js em cada página do dashboard.
===================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

    if (typeof client === "undefined") return;

    const { data: { session } } = await client.auth.getSession();
    if (!session) return;

    const perfil = await obterPerfilComRole(session.user.id);
    const role = perfil.role;

    const nav = document.querySelector(".sidebar nav");
    if (!nav) return;

    const logoutLink = document.getElementById("logoutBtn");

    // Catador não precisa das telas de usuário padrão
    const escondidosParaCatador = [
        "dashboard.html",
        "reciclagens.html",
        "recompensas-dashboard.html",
        "ranking.html"
    ];

    if (role === "catador") {
        nav.querySelectorAll("a").forEach(a => {
            const href = a.getAttribute("href");
            if (escondidosParaCatador.includes(href)) {
                a.style.display = "none";
            }
        });
    }

    // Link "Máquinas" para catador e admin
    if ((role === "catador" || role === "admin") && !nav.querySelector('a[href="maquinas.html"]')) {
        const link = document.createElement("a");
        link.href = "maquinas.html";
        link.innerHTML = `<i class="fa-solid fa-industry"></i><span class="link-text">Máquinas</span>`;
        if (window.location.pathname.endsWith("maquinas.html")) link.classList.add("active");
        nav.insertBefore(link, logoutLink);
    }

    // Link "Administração" só para admin
    if (role === "admin" && !nav.querySelector('a[href="admin.html"]')) {
        const link = document.createElement("a");
        link.href = "admin.html";
        link.innerHTML = `<i class="fa-solid fa-user-shield"></i><span class="link-text">Administração</span>`;
        if (window.location.pathname.endsWith("admin.html")) link.classList.add("active");
        nav.insertBefore(link, logoutLink);
    }

});
