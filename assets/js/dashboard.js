/* =====================================
   SICRAI DASHBOARD
===================================== */

async function init() {
    const { data: { session } } = await client.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    carregarDados();
}

// Substitui o carregarDados() no final do arquivo por:
init();

// DARK MODE - aplica antes de tudo pra evitar flash
(function () {
    if (localStorage.getItem("tema") === "dark") {
        document.body.classList.add("dark");
    }
})();

// SAUDAÇÃO
function obterSaudacao() {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
}

/* =====================================
   CONTADORES ANIMADOS
===================================== */

function contador(id, destino) {
    const elemento = document.getElementById(id);
    if (!elemento) return;
    let atual = 0;
    const incremento = Math.ceil(destino / 100) || 1;
    const timer = setInterval(() => {
        atual += incremento;
        if (atual >= destino) {
            atual = destino;
            clearInterval(timer);
        }
        elemento.innerHTML = atual.toLocaleString("pt-BR");
    }, 15);
}

/* =====================================
   METAS
===================================== */

function atualizarMetas(pontos) {

    // META SEMANAL (meta menor: 500 pontos)
    const metaSemanal = 500;
    const porcentagemSemanal = Math.min((pontos / metaSemanal) * 100, 100);

    const baraSemanal = document.getElementById("metaSemanalprogress");
    const textoSemanal = document.getElementById("metaSemanalTexto");

    if (baraSemanal) {
        setTimeout(() => {
            baraSemanal.style.width = porcentagemSemanal + "%";
        }, 300);
    }

    if (textoSemanal) {
        const atual = Math.min(pontos, metaSemanal);
        textoSemanal.textContent = `${atual.toLocaleString("pt-BR")} de ${metaSemanal.toLocaleString("pt-BR")} pontos`;
    }

    // META MENSAL (meta maior: 3000 pontos)
    const metaMensal = 3000;
    const porcentagemMensal = Math.min((pontos / metaMensal) * 100, 100);

    const baraMensal = document.getElementById("metaProgress");
    const textoMensal = document.getElementById("metaMensalTexto");

    if (baraMensal) {
        setTimeout(() => {
            baraMensal.style.width = porcentagemMensal + "%";
        }, 300);
    }

    if (textoMensal) {
        textoMensal.textContent = `${pontos.toLocaleString("pt-BR")} de ${metaMensal.toLocaleString("pt-BR")} pontos`;
    }

}

/* =====================================
   HISTÓRICO
===================================== */

async function carregarHistorico(userId) {
    const lista = document.getElementById("historicoLista");
    if (!lista) return;

    lista.innerHTML = `<li style="color:#999; font-size:.9rem;">Carregando histórico...</li>`;

    // Busca reciclagens (pontos ganhos)
    const { data: reciclagens, error: erroReciclagens } = await client
        .from("reciclagens")
        .select("latinhas, pontos, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

    // Busca resgates
    const { data: resgates, error: erroResgates } = await client
        .from("resgates")
        .select("nome, pontos, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

    // Se as duas consultas falharem, algo está errado na tabela/permissão —
    // avisa em vez de mostrar "vazio" silenciosamente.
    if (erroReciclagens && erroResgates) {
        console.error("Erro ao carregar histórico:", erroReciclagens, erroResgates);
        lista.innerHTML = `<li style="color:#e53935; font-size:.9rem;">
            Não foi possível carregar o histórico. Veja o console (F12) para detalhes.
        </li>`;
        if (typeof mostrarToast === "function") {
            mostrarToast("Erro ao carregar o histórico. Veja o console para detalhes.", "erro");
        }
        return;
    }

    if (erroReciclagens) console.error("Erro ao carregar reciclagens:", erroReciclagens);
    if (erroResgates) console.error("Erro ao carregar resgates:", erroResgates);

    // Junta e ordena por data (mais recente primeiro)
    const eventos = [];

    (reciclagens || []).forEach(r => eventos.push({
        tipo: "reciclagem",
        texto: `Reciclou ${r.latinhas} latinha${r.latinhas > 1 ? "s" : ""} → +${r.pontos} pontos`,
        icone: "fa-recycle",
        cor: "#249341",
        data: r.created_at
    }));

    (resgates || []).forEach(r => eventos.push({
        tipo: "resgate",
        texto: `Resgatou "${r.nome}" → -${r.pontos} pontos`,
        icone: "fa-gift",
        cor: "#e53935",
        data: r.created_at
    }));

    eventos.sort((a, b) => new Date(b.data) - new Date(a.data));

    lista.innerHTML = "";

    if (eventos.length === 0) {
        lista.innerHTML = `<li style="color:#999; font-size:.9rem;">Nenhuma atividade ainda.</li>`;
        return;
    }

    eventos.slice(0, 10).forEach(ev => {
        const li = document.createElement("li");
        li.innerHTML = `<i class="fa-solid ${ev.icone}" style="color:${ev.cor}"></i> ${ev.texto}`;
        lista.appendChild(li);
    });
}

/* =====================================
   RANKING
===================================== */

async function carregarRanking() {
    const rankingLista = document.getElementById("rankingLista");
    if (!rankingLista) return;

    const { data, error } = await client
        .from("perfis")
        .select("nome, pontos")
        .order("pontos", { ascending: false })
        .limit(5);

    if (error || !data) return;

    rankingLista.innerHTML = "";

    data.forEach((user, index) => {
        const item = document.createElement("div");
        item.classList.add("ranking-item");
        item.innerHTML = `
            <span>#${index + 1}</span>
            <strong>${user.nome || "Reciclador"}</strong>
            <span>${(user.pontos || 0).toLocaleString("pt-BR")} pts</span>
        `;
        rankingLista.appendChild(item);
    });
}

/* =====================================
   RECOMPENSAS (cartões dentro do próprio dashboard,
   só rodam se a seção #rewardContainer existir na página)
===================================== */

const recompensas = [
    { nome: "Vale Lanche", pontos: 500 },
    { nome: "Caneca Personalizada", pontos: 800 },
    { nome: "Camiseta SICRAI", pontos: 1200 },
    { nome: "Garrafa Térmica", pontos: 1500 },
    { nome: "Kit Sustentável", pontos: 2000 }
];

const containerRewards = document.getElementById("rewardContainer");

if (containerRewards) {
    recompensas.forEach(reward => {
        const card = document.createElement("div");
        card.classList.add("reward-card");
        card.innerHTML = `
            <h3>${reward.nome}</h3>
            <p>Necessário: <strong>${reward.pontos} pontos</strong></p>
            <button class="resgatar" data-pontos="${reward.pontos}" data-nome="${reward.nome}">Resgatar</button>
        `;
        containerRewards.appendChild(card);
    });
}

document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("resgatar")) return;

    const { data: { session } } = await client.auth.getSession();
    if (!session) return;

    const { data: perfil } = await client
        .from("perfis")
        .select("pontos")
        .eq("id", session.user.id)
        .single();

    const pontosNecessarios = parseInt(e.target.dataset.pontos);
    const nomeRecompensa    = e.target.dataset.nome || "Recompensa";

    if (!perfil || perfil.pontos < pontosNecessarios) {
        mostrarToast("Pontos insuficientes para resgatar esta recompensa.", "aviso");
        return;
    }

    const { error } = await client
        .from("perfis")
        .update({ pontos: perfil.pontos - pontosNecessarios })
        .eq("id", session.user.id);

    if (error) {
        mostrarToast("Erro ao resgatar recompensa.", "erro");
        return;
    }

    // Grava o resgate no histórico
    const { error: erroHistorico } = await client.from("resgates").insert({
        user_id: session.user.id,
        nome:    nomeRecompensa,
        pontos:  pontosNecessarios
    });

    if (erroHistorico) {
        console.error("Erro ao gravar resgate no histórico:", erroHistorico);
        mostrarToast(`"${nomeRecompensa}" resgatado, mas houve um erro ao salvar no histórico.`, "aviso");
    } else {
        mostrarToast(`🎉 "${nomeRecompensa}" resgatado com sucesso!`, "sucesso");
    }

    carregarDados();
});

/* =====================================
   BOTÃO FLUTUANTE - ADICIONAR LATINHA(S)
   Pergunta a quantidade antes de salvar.
   Cada latinha vale 5 pontos.
===================================== */

function pedirQuantidadeLatinhas() {
    return new Promise((resolve) => {

        const overlay = document.createElement("div");
        overlay.className = "confirm-overlay";
        overlay.innerHTML = `
            <div class="confirm-box">
                <div class="confirm-icone" style="background:linear-gradient(135deg,#249341,#48a840);">
                    <i class="fa-solid fa-recycle"></i>
                </div>
                <h3>Adicionar Latinhas</h3>
                <p>Quantas latinhas você quer adicionar? Cada uma vale 5 pontos.</p>
                <div class="input-group" style="text-align:left; margin-bottom:20px;">
                    <label>Quantidade</label>
                    <input
                        type="number"
                        id="inputQtdLatinhas"
                        min="1"
                        value="1"
                        style="text-align:center; font-size:1.3rem; font-weight:700;">
                </div>
                <div class="confirm-botoes">
                    <button class="confirm-cancelar">Cancelar</button>
                    <button class="confirm-confirmar" style="background:linear-gradient(135deg,#249341,#48a840);">
                        Adicionar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("show"));

        const input = overlay.querySelector("#inputQtdLatinhas");
        input.focus();
        input.select();

        function fechar(valor) {
            overlay.classList.remove("show");
            setTimeout(() => overlay.remove(), 250);
            resolve(valor);
        }

        function confirmar() {
            const qtd = parseInt(input.value);
            if (!qtd || qtd < 1) {
                if (typeof mostrarToast === "function") {
                    mostrarToast("Digite uma quantidade válida.", "aviso");
                }
                input.focus();
                return;
            }
            fechar(qtd);
        }

        overlay.querySelector(".confirm-cancelar").addEventListener("click", () => fechar(null));
        overlay.querySelector(".confirm-confirmar").addEventListener("click", confirmar);

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                confirmar();
            }
        });

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) fechar(null);
        });
    });
}

const btnFlutuante = document.createElement("button");
btnFlutuante.id = "btnAdicionarLatinha";
btnFlutuante.innerHTML = `<i class="fa-solid fa-plus"></i> Adicionar Latinha`;
document.body.appendChild(btnFlutuante);

btnFlutuante.addEventListener("click", async () => {

    const qtd = await pedirQuantidadeLatinhas();
    if (!qtd) return;

    btnFlutuante.disabled = true;
    btnFlutuante.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;

    const { data: { session } } = await client.auth.getSession();
    if (!session) {
        btnFlutuante.disabled = false;
        btnFlutuante.innerHTML = `<i class="fa-solid fa-plus"></i> Adicionar Latinha`;
        return;
    }

    const { data: perfil, error: erroGet } = await client
        .from("perfis")
        .select("pontos, latinhas")
        .eq("id", session.user.id)
        .single();

    if (erroGet || !perfil) {
        mostrarToast("Erro ao buscar seus dados. Tente novamente.", "erro");
        btnFlutuante.disabled = false;
        btnFlutuante.innerHTML = `<i class="fa-solid fa-plus"></i> Adicionar Latinha`;
        return;
    }

    const novasLatinhas = (perfil.latinhas || 0) + qtd;
    const novosPontos = (perfil.pontos || 0) + (qtd * 5);

    const { error } = await client
        .from("perfis")
        .update({ latinhas: novasLatinhas, pontos: novosPontos })
        .eq("id", session.user.id);

    // Grava o evento no histórico
    if (!error) {
        const { error: erroHistorico } = await client.from("reciclagens").insert({
            user_id: session.user.id,
            latinhas: qtd,
            pontos: qtd * 5
        });
        if (erroHistorico) {
            console.error("Erro ao gravar latinha no histórico:", erroHistorico);
        }
    }

    if (error) {
        mostrarToast("Erro ao adicionar latinha. Tente novamente.", "erro");
        btnFlutuante.disabled = false;
        btnFlutuante.innerHTML = `<i class="fa-solid fa-plus"></i> Adicionar Latinha`;
        return;
    }

    mostrarToast(`${qtd} latinha${qtd > 1 ? "s" : ""} adicionada${qtd > 1 ? "s" : ""} com sucesso!`, "sucesso");
    btnFlutuante.innerHTML = `<i class="fa-solid fa-check"></i> Adicionado!`;
    setTimeout(() => {
        btnFlutuante.disabled = false;
        btnFlutuante.innerHTML = `<i class="fa-solid fa-plus"></i> Adicionar Latinha`;
    }, 1500);

    carregarDados();

});

/* =====================================
   CARREGAR DADOS DO USUÁRIO
===================================== */

async function carregarDados() {

    const { data: { session } } = await client.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
        return;
    }

    const user = session.user;

    const saudacaoDashboard = document.getElementById("dashboardGreeting");
    if (saudacaoDashboard) {
        const nome = user.user_metadata?.nome || "Reciclador";
        saudacaoDashboard.innerHTML = `${obterSaudacao()}, ${nome}! 🌱`;
    }

    const { data: perfil, error } = await client
        .from("perfis")
        .select("pontos, latinhas")
        .eq("id", user.id)
        .single();

    if (error || !perfil) return;

    const pontos = perfil.pontos || 0;
    const latinhas = perfil.latinhas || 0;

    const { count } = await client
        .from("perfis")
        .select("id", { count: "exact" })
        .gt("pontos", pontos);

    const posicaoRanking = (count || 0) + 1;

    contador("pontosCard", pontos);
    contador("latinhasCard", latinhas);
    contador("rankingCard", posicaoRanking);
    contador("recompensasCard", 0);

    atualizarMetas(pontos);

    carregarHistorico(user.id);
    carregarRanking();
}


/* =====================================
   DARK MODE
===================================== */

const toggleDark = document.getElementById("toggleDark");

if (toggleDark) {
    toggleDark.addEventListener("click", () => {
        document.body.classList.toggle("dark");
        localStorage.setItem("tema",
            document.body.classList.contains("dark") ? "dark" : "light"
        );
    });
}