/* =====================================
   SICRAI - NOTIFICAÇÕES (TOASTS) E CONFIRMAÇÕES
   Inclua assets/css/toast.css + este arquivo em
   qualquer página do projeto para ter acesso a:

   - mostrarToast(mensagem, tipo)
       tipo: "sucesso" (padrão) | "erro" | "aviso"

   - await confirmarAcao(mensagem, opcoes)
       opcoes (todas opcionais): { titulo, textoConfirmar, textoCancelar }
       retorna true (confirmou) ou false (cancelou)
===================================== */

(function () {

    function garantirContainer() {
        let container = document.getElementById("toastContainer");
        if (!container) {
            container = document.createElement("div");
            container.id = "toastContainer";
            container.className = "toast-container";
            document.body.appendChild(container);
        }
        return container;
    }

    window.mostrarToast = function (mensagem, tipo = "sucesso") {
        const container = garantirContainer();

        const icones = {
            sucesso: "fa-circle-check",
            erro: "fa-circle-exclamation",
            aviso: "fa-triangle-exclamation"
        };

        const toast = document.createElement("div");
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `
            <i class="fa-solid ${icones[tipo] || icones.sucesso} toast-icone"></i>
            <div class="toast-texto">${mensagem}</div>
            <button class="toast-fechar"><i class="fa-solid fa-xmark"></i></button>
        `;

        function remover() {
            toast.classList.add("saindo");
            setTimeout(() => toast.remove(), 280);
        }

        toast.querySelector(".toast-fechar").addEventListener("click", remover);
        container.appendChild(toast);

        setTimeout(remover, 4500);
    };

    window.confirmarAcao = function (mensagem, opcoes = {}) {
        return new Promise((resolve) => {

            const titulo = opcoes.titulo || "Tem certeza?";
            const textoConfirmar = opcoes.textoConfirmar || "Confirmar";
            const textoCancelar = opcoes.textoCancelar || "Cancelar";

            const anterior = document.getElementById("confirmOverlay");
            if (anterior) anterior.remove();

            const overlay = document.createElement("div");
            overlay.className = "confirm-overlay";
            overlay.id = "confirmOverlay";
            overlay.innerHTML = `
                <div class="confirm-box">
                    <div class="confirm-icone"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <h3>${titulo}</h3>
                    <p>${mensagem}</p>
                    <div class="confirm-botoes">
                        <button class="confirm-cancelar">${textoCancelar}</button>
                        <button class="confirm-confirmar">${textoConfirmar}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add("show"));

            function fechar(resultado) {
                overlay.classList.remove("show");
                setTimeout(() => overlay.remove(), 250);
                resolve(resultado);
            }

            overlay.querySelector(".confirm-cancelar").addEventListener("click", () => fechar(false));
            overlay.querySelector(".confirm-confirmar").addEventListener("click", () => fechar(true));
            overlay.addEventListener("click", (e) => {
                if (e.target === overlay) fechar(false);
            });
        });
    };

})();