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

    const links = Array.from(nav.querySelectorAll("a"));
    const activeIndex = links.findIndex(a => a.classList.contains("active"));
    if (activeIndex === -1) return;

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

});