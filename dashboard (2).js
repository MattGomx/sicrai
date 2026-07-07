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
   HISTÓRICO (dados reais: reciclagens + resgates)
===================================== */

async function carregarHistoricoReal(userId) {

    const listaHistorico = document.getElementById("historicoLista");
    if (!listaHistorico) return;

    const { data: reciclagensData } = await client
        .from("reciclagens")
        .select("latinhas, pontos, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

    const { data: resgatesData } = await client
        .from("resgates")
        .select("nome, pontos, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

    const eventos = [];

    (reciclagensData || []).forEach(item => {
        eventos.push({
            positivo: true,
            texto: `Você reciclou ${item.latinhas} latinha${item.latinhas > 1 ? "s" : ""} (+${item.pontos} pontos)`,
            data: item.created_at
        });
    });

    (resgatesData || []).forEach(item => {
        eventos.push({
            positivo: false,
            texto: `Você resgatou "${item.nome}" (-${item.pontos} pontos)`,
            data: item.created_at
        });
    });

    eventos.sort((a, b) => new Date(b.data) - new Date(a.data));

    listaHistorico.innerHTML = "";

    if (eventos.length === 0) {
        listaHistorico.innerHTML = `<li>Você ainda não tem nenhuma atividade registrada.</li>`;
        return;
    }

    eventos.slice(0, 8).forEach(ev => {
        const li = document.createElement("li");
        const icone = ev.positivo
            ? `<i class="fa-solid fa-circle-check" style="color:#249341"></i>`
            : `<i class="fa-solid fa-circle-minus" style="color:#e53935"></i>`;
        li.innerHTML = `${icone} ${ev.texto}`;
        listaHistorico.appendChild(li);
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
   RECOMPENSAS
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
    const nomeRecompensa = e.target.dataset.nome;

    if (!perfil || perfil.pontos < pontosNecessarios) {
        alert("Pontos insuficientes para resgatar esta recompensa.");
        return;
    }

    const { error } = await client
        .from("perfis")
        .update({ pontos: perfil.pontos - pontosNecessarios })
        .eq("id", session.user.id);

    if (error) {
        alert("Erro ao resgatar recompensa.");
        return;
    }

    // Registra o resgate no histórico (aparece em vermelho no histórico depois)
    await client.from("resgates").insert({
        user_id: session.user.id,
        nome: nomeRecompensa,
        pontos: pontosNecessarios
    });

    alert("🎉 Recompensa resgatada com sucesso!");
    carregarDados();
});

/* =====================================
   BOTÃO FLUTUANTE - ADICIONAR LATINHA
   +1 latinha = +5 pontos no Supabase
===================================== */

const btnFlutuante = document.createElement("button");
btnFlutuante.id = "btnAdicionarLatinha";
btnFlutuante.innerHTML = `<i class="fa-solid fa-plus"></i> +1 Latinha`;
document.body.appendChild(btnFlutuante);

btnFlutuante.addEventListener("click", async () => {

    btnFlutuante.disabled = true;
    btnFlutuante.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Salvando...`;

    const { data: { session } } = await client.auth.getSession();
    if (!session) {
        btnFlutuante.disabled = false;
        btnFlutuante.innerHTML = `<i class="fa-solid fa-plus"></i> +1 Latinha`;
        return;
    }

    const { data: perfil, error: erroGet } = await client
        .from("perfis")
        .select("pontos, latinhas")
        .eq("id", session.user.id)
        .single();

    if (erroGet || !perfil) {
        alert("Erro ao buscar seus dados. Tente novamente.");
        btnFlutuante.disabled = false;
        btnFlutuante.innerHTML = `<i class="fa-solid fa-plus"></i> +1 Latinha`;
        return;
    }

    const novasLatinhas = (perfil.latinhas || 0) + 1;
    const novosPontos = (perfil.pontos || 0) + 5; // 5 pontos por latinha

    const { error } = await client
        .from("perfis")
        .update({ latinhas: novasLatinhas, pontos: novosPontos })
        .eq("id", session.user.id);

    // Grava o evento no histórico
    if (!error) {
        await client.from("reciclagens").insert({
            user_id: session.user.id,
            latinhas: 1,
            pontos: 5
        });
    }

    if (error) {
        alert("Erro ao adicionar latinha. Tente novamente.");
        btnFlutuante.disabled = false;
        btnFlutuante.innerHTML = `<i class="fa-solid fa-plus"></i> +1 Latinha`;
        return;
    }

    btnFlutuante.innerHTML = `<i class="fa-solid fa-check"></i> Latinha adicionada!`;
    setTimeout(() => {
        btnFlutuante.disabled = false;
        btnFlutuante.innerHTML = `<i class="fa-solid fa-plus"></i> +1 Latinha`;
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

    carregarHistoricoReal(user.id);
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
