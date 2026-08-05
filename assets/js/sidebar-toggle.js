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

document.addEventListener("DOMContentLoaded", () => {

    const STORAGE_KEY = "sidebarActiveIndex";
    const nav = document.querySelector(".sidebar nav");
    if (!nav) return;

    // Lê os links e o índice ativo NA HORA (para poder recalcular depois)
    function obterLinksEIndice() {
        const links = Array.from(nav.querySelectorAll("a"));
        const activeIndex = links.findIndex(a => a.classList.contains("active"));
        return { links, activeIndex };
    }

    let { links, activeIndex } = obterLinksEIndice();

    let indicator = nav.querySelector(".nav-indicator");
    if (!indicator) {
        indicator = document.createElement("div");
        indicator.className = "nav-indicator";
        nav.prepend(indicator);
    }

    function posicionar(index, animado) {
        const link = links[index];
        if (!link) return;
        indicator.style.transition = animado ? "" : "none";
        indicator.style.height = link.offsetHeight + "px";
        indicator.style.transform = `translateY(${link.offsetTop}px)`;
    }

    if (activeIndex !== -1) {

        const indicePrevio = sessionStorage.getItem(STORAGE_KEY);

        if (indicePrevio !== null && links[Number(indicePrevio)]) {
            // posiciona sem animação onde estava antes
            posicionar(Number(indicePrevio), false);
            // força o navegador a "registrar" essa posição antes de animar
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    posicionar(activeIndex, true);
                });
            });
        } else {
            posicionar(activeIndex, false);
        }

        sessionStorage.setItem(STORAGE_KEY, activeIndex);
    }

    // NOVO: quando sidebar-role.js terminar de injetar/esconder links
    // (processo assíncrono, que acontece DEPOIS deste script rodar),
    // ele dispara este evento e recalculamos a posição do indicador
    // com a lista de links já atualizada — evita o indicador "pular"
    // para o item errado.
    document.addEventListener("sidebarLinksAtualizados", () => {

        ({ links, activeIndex } = obterLinksEIndice());

        if (activeIndex !== -1) {
            posicionar(activeIndex, false);
            sessionStorage.setItem(STORAGE_KEY, activeIndex);
        }
    });

});
