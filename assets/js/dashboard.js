/* =====================================
   SICRAI DASHBOARD
===================================== */

// DARK MODE — aplica antes de tudo pra evitar flash
(function () {
    if (localStorage.getItem("tema") === "dark") {
        document.body.classList.add("dark");
    }
})();

/* =====================================
   SAUDAÇÃO
===================================== */
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
        if (atual >= destino) { atual = destino; clearInterval(timer); }
        elemento.innerHTML = atual.toLocaleString("pt-BR");
    }, 15);
}

/* =====================================
   METAS
===================================== */
function atualizarMetas(pontos) {
    const metaSemanal = 500;
    const pctSemanal  = Math.min((pontos / metaSemanal) * 100, 100);
    const barSemanal  = document.getElementById("metaSemanalprogress");
    const txtSemanal  = document.getElementById("metaSemanalTexto");
    if (barSemanal) setTimeout(() => barSemanal.style.width = pctSemanal + "%", 300);
    if (txtSemanal) txtSemanal.textContent =
        `${Math.min(pontos, metaSemanal).toLocaleString("pt-BR")} de ${metaSemanal.toLocaleString("pt-BR")} pontos`;

    const metaMensal = 3000;
    const pctMensal  = Math.min((pontos / metaMensal) * 100, 100);
    const barMensal  = document.getElementById("metaProgress");
    const txtMensal  = document.getElementById("metaMensalTexto");
    if (barMensal) setTimeout(() => barMensal.style.width = pctMensal + "%", 300);
    if (txtMensal) txtMensal.textContent =
        `${pontos.toLocaleString("pt-BR")} de ${metaMensal.toLocaleString("pt-BR")} pontos`;
}

/* =====================================
   HISTÓRICO — resgates + pontos ganhos
===================================== */
async function carregarHistorico(userId) {
    const lista = document.getElementById("historicoLista");
    if (!lista) return;

    // Busca reciclagens (pontos ganhos)
    const { data: reciclagens } = await client
        .from("reciclagens")
        .select("latinhas, pontos, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

    // Busca resgates
    const { data: resgates } = await client
        .from("resgates")
        .select("nome, pontos, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

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
   RECOMPENSAS — iguais à página pública
===================================== */
const recompensas = [
    { nome: "Vale Lanche",        pontos: 500,  icone: "fa-burger"      },
    { nome: "Caneca Personalizada", pontos: 800, icone: "fa-mug-hot"    },
    { nome: "Camiseta",           pontos: 1200, icone: "fa-shirt"       },
    { nome: "Garrafa Térmica",    pontos: 1500, icone: "fa-bottle-water"},
    { nome: "Kit Sustentável",    pontos: 2000, icone: "fa-leaf"        },
    { nome: "Prêmio Especial",    pontos: 5000, icone: "fa-medal"       },
];

function renderizarRecompensas(pontosAtuais) {
    const container = document.getElementById("rewardContainer");
    if (!container) return;
    container.innerHTML = "";
    recompensas.forEach(r => {
        const podeResgatar = pontosAtuais >= r.pontos;
        const card = document.createElement("div");
        card.classList.add("reward-card");
        card.innerHTML = `
            <div class="reward-card-icon">
                <i class="fa-solid ${r.icone}"></i>
            </div>
            <h3>${r.nome}</h3>
            <p>${r.pontos.toLocaleString("pt-BR")} pontos</p>
            <button class="resgatar"
                data-pontos="${r.pontos}"
                data-nome="${r.nome}"
                ${podeResgatar ? "" : "disabled"}>
                ${podeResgatar ? "Resgatar" : "Pontos insuficientes"}
            </button>
        `;
        container.appendChild(card);
    });
}

document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("resgatar") || e.target.disabled) return;

    const { data: { session } } = await client.auth.getSession();
    if (!session) return;

    const pontosNecessarios = parseInt(e.target.dataset.pontos);
    const nomeRecompensa    = e.target.dataset.nome;

    if (!confirm(`Resgatar "${nomeRecompensa}" por ${pontosNecessarios.toLocaleString("pt-BR")} pontos?`)) return;

    const { data: perfil } = await client
        .from("perfis").select("pontos").eq("id", session.user.id).single();

    if (!perfil || perfil.pontos < pontosNecessarios) {
        alert("Pontos insuficientes.");
        return;
    }

    const novosPontos = perfil.pontos - pontosNecessarios;

    const { error: erroPontos } = await client
        .from("perfis")
        .update({ pontos: novosPontos })
        .eq("id", session.user.id);

    if (erroPontos) { alert("Erro ao resgatar recompensa."); return; }

    // Grava o resgate no histórico
    await client.from("resgates").insert({
        user_id: session.user.id,
        nome:    nomeRecompensa,
        pontos:  pontosNecessarios
    });

    alert(`🎉 "${nomeRecompensa}" resgatado com sucesso!`);
    carregarDados();
});

/* =====================================
   MODAL — ADICIONAR LATINHAS
===================================== */

// Cria o modal no body
const modalHTML = `
<div id="modalLatinhas" style="
    display:none; position:fixed; inset:0;
    background:rgba(0,0,0,.5); backdrop-filter:blur(4px);
    z-index:9999; align-items:center; justify-content:center; padding:20px;">
    <div style="
        background:#fff; border-radius:24px; padding:36px 32px;
        width:100%; max-width:380px; box-shadow:0 20px 50px rgba(0,0,0,.2);
        position:relative; font-family:'Poppins',sans-serif;">
        <button onclick="fecharModalLatinhas()" style="
            position:absolute; top:14px; right:16px;
            background:#f0f0f0; border:none; border-radius:50%;
            width:34px; height:34px; font-size:1rem; cursor:pointer;
            display:flex; align-items:center; justify-content:center; color:#555;">
            <i class="fa-solid fa-xmark"></i>
        </button>
        <div style="
            width:62px; height:62px; border-radius:50%;
            background:linear-gradient(135deg,#249341,#48a840);
            display:flex; align-items:center; justify-content:center;
            font-size:1.6rem; color:white; margin:0 auto 18px;
            box-shadow:0 8px 20px rgba(36,147,65,.3);">
            <i class="fa-solid fa-recycle"></i>
        </div>
        <h2 style="text-align:center; margin-bottom:8px; font-size:1.3rem;">Registrar Latinhas</h2>
        <p style="text-align:center; color:#777; font-size:.88rem; margin-bottom:24px;">
            Cada latinha vale <strong style="color:#249341;">5 pontos</strong>.
        </p>
        <label style="font-weight:600; font-size:.92rem; display:block; margin-bottom:8px;">
            Quantas latinhas?
        </label>
        <input id="qtdLatinhas" type="number" min="1" max="9999" placeholder="Ex: 10"
            style="width:100%; padding:13px 16px; border:2px solid #e0e0e0;
            border-radius:12px; font-family:'Poppins',sans-serif; font-size:1rem;
            outline:none; margin-bottom:8px; transition:border-color .2s;"
            oninput="atualizarPreview()"
            onfocus="this.style.borderColor='#249341'"
            onblur="this.style.borderColor='#e0e0e0'">
        <p id="previewPontos" style="text-align:center; color:#249341; font-weight:700;
            font-size:.95rem; margin-bottom:20px; min-height:22px;"></p>
        <button onclick="confirmarLatinhas()" id="btnConfirmarLatinhas" style="
            width:100%; border:none; border-radius:13px; padding:14px;
            font-family:'Poppins',sans-serif; font-size:1rem; font-weight:700;
            color:white; background:linear-gradient(135deg,#249341,#48a840);
            cursor:pointer; box-shadow:0 6px 18px rgba(36,147,65,.3);
            display:flex; align-items:center; justify-content:center; gap:8px;
            transition:transform .2s, opacity .2s;">
            <i class="fa-solid fa-plus"></i> Confirmar
        </button>
    </div>
</div>`;

document.body.insertAdjacentHTML("beforeend", modalHTML);

// Dark mode no modal
const modalEl = document.getElementById("modalLatinhas");
const modalCard = modalEl.querySelector("div > div");

function sincronizarDarkModal() {
    const dark = document.body.classList.contains("dark");
    modalCard.style.background = dark ? "#1e1e1e" : "#fff";
    modalCard.style.color      = dark ? "#fff"    : "#222";
}

function abrirModalLatinhas() {
    document.getElementById("qtdLatinhas").value = "";
    document.getElementById("previewPontos").textContent = "";
    modalEl.style.display = "flex";
    document.body.style.overflow = "hidden";
    sincronizarDarkModal();
    setTimeout(() => document.getElementById("qtdLatinhas").focus(), 60);
}

function fecharModalLatinhas() {
    modalEl.style.display = "none";
    document.body.style.overflow = "";
}

modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl) fecharModalLatinhas();
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.style.display === "flex") fecharModalLatinhas();
    if (e.key === "Enter"  && modalEl.style.display === "flex") confirmarLatinhas();
});

function atualizarPreview() {
    const qtd = parseInt(document.getElementById("qtdLatinhas").value) || 0;
    const preview = document.getElementById("previewPontos");
    if (qtd > 0) {
        preview.textContent = `+${(qtd * 5).toLocaleString("pt-BR")} pontos`;
    } else {
        preview.textContent = "";
    }
}

async function confirmarLatinhas() {
    const qtd = parseInt(document.getElementById("qtdLatinhas").value);
    if (!qtd || qtd < 1) {
        document.getElementById("qtdLatinhas").style.borderColor = "#e53935";
        setTimeout(() => document.getElementById("qtdLatinhas").style.borderColor = "#e0e0e0", 1500);
        return;
    }

    const btn = document.getElementById("btnConfirmarLatinhas");
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;

    const { data: { session } } = await client.auth.getSession();
    if (!session) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-plus"></i> Confirmar`; return; }

    const { data: perfil, error: erroGet } = await client
        .from("perfis").select("pontos, latinhas").eq("id", session.user.id).single();

    if (erroGet || !perfil) {
        alert("Erro ao buscar seus dados.");
        btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-plus"></i> Confirmar`; return;
    }

    const novasLatinhas = (perfil.latinhas || 0) + qtd;
    const novosPontos   = (perfil.pontos   || 0) + (qtd * 5);

    const { error } = await client
        .from("perfis")
        .update({ latinhas: novasLatinhas, pontos: novosPontos })
        .eq("id", session.user.id);

    if (!error) {
        await client.from("reciclagens").insert({
            user_id: session.user.id,
            latinhas: qtd,
            pontos:   qtd * 5
        });
    }

    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-plus"></i> Confirmar`;

    if (error) { alert("Erro ao adicionar latinhas."); return; }

    fecharModalLatinhas();
    carregarDados();
}

/* =====================================
   BOTÃO FLUTUANTE
===================================== */
const btnFlutuante = document.createElement("button");
btnFlutuante.id = "btnAdicionarLatinha";
btnFlutuante.innerHTML = `<i class="fa-solid fa-recycle"></i> Latinhas`;
btnFlutuante.addEventListener("click", abrirModalLatinhas);
document.body.appendChild(btnFlutuante);

/* =====================================
   CARREGAR DADOS DO USUÁRIO
===================================== */
async function carregarDados() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) { window.location.href = "login.html"; return; }

    const user = session.user;

    const saudacaoDashboard = document.getElementById("dashboardGreeting");
    if (saudacaoDashboard) {
        const nome = user.user_metadata?.nome || "Reciclador";
        saudacaoDashboard.innerHTML = `${obterSaudacao()}, ${nome}! 🌱`;
    }

    const { data: perfil, error } = await client
        .from("perfis").select("pontos, latinhas").eq("id", user.id).single();

    if (error || !perfil) return;

    const pontos   = perfil.pontos   || 0;
    const latinhas = perfil.latinhas || 0;

    const { count } = await client
        .from("perfis").select("id", { count: "exact" }).gt("pontos", pontos);

    const posicaoRanking = (count || 0) + 1;

    contador("pontosCard",      pontos);
    contador("latinhasCard",    latinhas);
    contador("rankingCard",     posicaoRanking);
    contador("recompensasCard", 0);

    atualizarMetas(pontos);
    renderizarRecompensas(pontos);
    carregarHistorico(user.id);
    carregarRanking();
}

/* =====================================
   INIT
===================================== */
async function init() {
    const { data: { session } } = await client.auth.getSession();
    if (!session) { window.location.href = "login.html"; return; }
    carregarDados();
}

init();

/* =====================================
   DARK MODE TOGGLE
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

// CSS extra para os cards de recompensa no dashboard
(function injetarCSS() {
    const style = document.createElement("style");
    style.textContent = `
        .reward-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
        }
        .reward-card-icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: linear-gradient(135deg, #249341, #48a840);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.6rem;
            color: white;
            margin-bottom: 14px;
            box-shadow: 0 6px 16px rgba(36,147,65,.25);
        }
        .reward-card h3 { margin-bottom: 6px; }
        .reward-card p  { color: #249341; font-weight: 700; font-size: 1rem; margin-bottom: 16px; }
        .reward-card button.resgatar {
            width: 100%;
            border: none;
            border-radius: 12px;
            padding: 12px;
            font-family: "Poppins", sans-serif;
            font-weight: 600;
            font-size: .92rem;
            color: white;
            background: linear-gradient(135deg, #249341, #48a840);
            cursor: pointer;
            transition: transform .2s, opacity .2s;
        }
        .reward-card button.resgatar:hover:not(:disabled) { transform: translateY(-2px); }
        .reward-card button.resgatar:disabled {
            background: #ccc;
            cursor: not-allowed;
            font-size: .82rem;
        }
        body.dark .reward-card-icon { box-shadow: 0 6px 16px rgba(72,168,64,.2); }
        body.dark .reward-card p    { color: #48a840; }
    `;
    document.head.appendChild(style);
})();