/* =====================================
   SICRAI DASHBOARD
===================================== */

// SAUDAÇÃO
function obterSaudacao(){

    const hora = new Date().getHours();

    if(hora < 12){
        return "Bom dia";
    }

    if(hora < 18){
        return "Boa tarde";
    }

    return "Boa noite";

}

const saudacaoDashboard =
document.getElementById("dashboardGreeting");

if(saudacaoDashboard){

    saudacaoDashboard.innerHTML =
    `${obterSaudacao()}, Reciclador! 🌱`;

}

/* =====================================
   DADOS SIMULADOS
===================================== */

const usuario = {

    pontos:2450,
    latinhas:245,
    ranking:12,
    recompensas:8

};

/* =====================================
   CONTADORES ANIMADOS
===================================== */

function contador(id, destino){

    const elemento =
    document.getElementById(id);

    if(!elemento) return;

    let atual = 0;

    const incremento =
    Math.ceil(destino / 100);

    const timer = setInterval(() => {

        atual += incremento;

        if(atual >= destino){

            atual = destino;

            clearInterval(timer);

        }

        elemento.innerHTML =
        atual.toLocaleString("pt-BR");

    },15);

}

contador("pontosCard", usuario.pontos);
contador("latinhasCard", usuario.latinhas);
contador("rankingCard", usuario.ranking);
contador("recompensasCard", usuario.recompensas);

/* =====================================
   META MENSAL
===================================== */

const metaAtual = 2450;
const metaTotal = 3000;

const porcentagem =
(metaAtual / metaTotal) * 100;

const progressBar =
document.getElementById("metaProgress");

if(progressBar){

    setTimeout(() => {

        progressBar.style.width =
        porcentagem + "%";

    },300);

}

/* =====================================
   HISTÓRICO
===================================== */

const historico = [

"Você reciclou 15 latinhas",
"Você ganhou 150 pontos",
"Você subiu para o Top 15",
"Você resgatou uma caneca",
"Meta semanal concluída"

];

const listaHistorico =
document.getElementById("historicoLista");

if(listaHistorico){

    historico.forEach(item => {

        const li =
        document.createElement("li");

        li.innerHTML =
        `<i class="fa-solid fa-circle-check"></i> ${item}`;

        listaHistorico.appendChild(li);

    });

}

/* =====================================
   RANKING
===================================== */

const ranking = [

{
nome:"João",
pontos:4500
},

{
nome:"Maria",
pontos:4100
},

{
nome:"Carlos",
pontos:3900
},

{
nome:"Ana",
pontos:3500
},

{
nome:"Você",
pontos:2450
}

];

const rankingLista =
document.getElementById("rankingLista");

if(rankingLista){

    ranking.forEach((user,index)=>{

        const item =
        document.createElement("div");

        item.classList.add("ranking-item");

        item.innerHTML = `

        <span>#${index+1}</span>

        <strong>${user.nome}</strong>

        <span>${user.pontos} pts</span>

        `;

        rankingLista.appendChild(item);

    });

}

/* =====================================
   RECOMPENSAS
===================================== */

const recompensas = [

{
nome:"Vale Lanche",
pontos:500
},

{
nome:"Caneca Personalizada",
pontos:800
},

{
nome:"Camiseta SICRAI",
pontos:1200
},

{
nome:"Garrafa Térmica",
pontos:1500
},

{
nome:"Kit Sustentável",
pontos:2000
}

];

const containerRewards =
document.getElementById("rewardContainer");

if(containerRewards){

    recompensas.forEach(reward => {

        const card =
        document.createElement("div");

        card.classList.add("reward-card");

        card.innerHTML = `

        <h3>${reward.nome}</h3>

        <p>
        Necessário:
        <strong>${reward.pontos} pontos</strong>
        </p>

        <button class="resgatar">
        Resgatar
        </button>

        `;

        containerRewards.appendChild(card);

    });

}

/* =====================================
   BOTÃO RESGATAR
===================================== */

document.addEventListener("click",(e)=>{

    if(e.target.classList.contains("resgatar")){

        alert(
        "🎉 Recompensa resgatada com sucesso!"
        );

    }

});

/* =====================================
   DARK MODE DASHBOARD
===================================== */

const toggleDark =
document.getElementById("toggleDark");

if(toggleDark){

    toggleDark.addEventListener("click",()=>{

        document.body.classList.toggle("dark");

        localStorage.setItem(
            "dashboardTheme",
            document.body.classList.contains("dark")
            ? "dark"
            : "light"
        );

    });

}

window.addEventListener("load",()=>{

    const tema =
    localStorage.getItem("dashboardTheme");

    if(tema === "dark"){

        document.body.classList.add("dark");

    }

});