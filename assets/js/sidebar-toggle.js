/* ===========================================================
   SIDEBAR TOGGLE (minimizar / maximizar)
   Lembra a preferência do usuário via localStorage
   =========================================================== */

(function () {

    const STORAGE_KEY = "sidebarCollapsed";

    document.addEventListener("DOMContentLoaded", () => {

        const sidebar   = document.querySelector(".sidebar");
        const toggleBtn = document.getElementById("sidebarToggle");

        if (!sidebar || !toggleBtn) return;

        const icon = toggleBtn.querySelector("i");

        function aplicarEstado(colapsado) {
            sidebar.classList.toggle("collapsed", colapsado);
            document.body.classList.toggle("sidebar-collapsed", colapsado);

            if (icon) {
                icon.className = colapsado
                    ? "fa-solid fa-angles-right"
                    : "fa-solid fa-angles-left";
            }

            toggleBtn.setAttribute(
                "aria-label",
                colapsado ? "Maximizar menu" : "Minimizar menu"
            );
        }

        // Restaura preferência salva
        const salvo = localStorage.getItem(STORAGE_KEY) === "true";
        aplicarEstado(salvo);

        toggleBtn.addEventListener("click", () => {
            const colapsado = !sidebar.classList.contains("collapsed");
            aplicarEstado(colapsado);
            localStorage.setItem(STORAGE_KEY, colapsado);
        });

    });

})();

/* ===========================================================
   INDICADOR DE ITEM ATIVO

   Guardamos o HREF do link ativo (não o índice numérico!),
   porque a quantidade de links muda de página pra página
   (Máquinas/Administração só existem depois que o
   sidebar-role.js injeta eles dinamicamente). Usar índice
   causava o indicador "pular" entre itens errados enquanto
   a lista final de links ainda não estava pronta.

   O indicador só fica visível DEPOIS que sabemos a lista
   final de links da página (evento "sidebarLinksAtualizados",
   disparado pelo sidebar-role.js). Se essa página não tiver
   sidebar-role.js, há um fallback por tempo.
   =========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "sidebarActiveHref";
    const nav = document.querySelector(".sidebar nav");
    if (!nav) return;

    let indicator = nav.querySelector(".nav-indicator");
    if (!indicator) {
        indicator = document.createElement("div");
        indicator.className = "nav-indicator";
        nav.prepend(indicator);
    }

    // Escondido até sabermos a posição final correta
    indicator.style.opacity = "0";

    function obterLinksEIndiceAtivo() {
        const links = Array.from(nav.querySelectorAll("a"));
        const activeIndex = links.findIndex(a => a.classList.contains("active"));
        return { links, activeIndex };
    }

    function posicionar(link, animado) {
        if (!link) return;
        indicator.style.transition = animado ? "" : "none";
        indicator.style.height = link.offsetHeight + "px";
        indicator.style.transform = `translateY(${link.offsetTop}px)`;
        indicator.style.opacity = "1";
    }

    function finalizarPosicionamento() {

        const { links, activeIndex } = obterLinksEIndiceAtivo();
        if (activeIndex === -1) return;

        const linkAtivo  = links[activeIndex];
        const hrefAtivo  = linkAtivo.getAttribute("href");

        const hrefAnterior = sessionStorage.getItem(STORAGE_KEY);
        const linkAnterior = hrefAnterior
            ? links.find(a => a.getAttribute("href") === hrefAnterior)
            : null;

        if (linkAnterior && linkAnterior !== linkAtivo) {
            // Já sabemos onde os dois links estão NA LISTA FINAL,
            // então a animação de um pro outro é sempre correta.
            posicionar(linkAnterior, false);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    posicionar(linkAtivo, true);
                });
            });
        } else {
            // Primeira visita nesta sessão, ou item repetido: sem animação
            posicionar(linkAtivo, false);
        }

        sessionStorage.setItem(STORAGE_KEY, hrefAtivo);
    }

    let jaFinalizou = false;

    // Espera o sidebar-role.js avisar que terminou de ajustar os links
    document.addEventListener("sidebarLinksAtualizados", () => {
        jaFinalizou = true;
        finalizarPosicionamento();
    });

    // Rede de segurança: se a página não tiver sidebar-role.js
    // (ou o usuário não estiver logado), posiciona mesmo assim
    // depois de um instante, pra não deixar o indicador sumido.
    setTimeout(() => {
        if (!jaFinalizou) finalizarPosicionamento();
    }, 150);

});