/* =====================================
   SICRAI - MAIN JS
===================================== */

// MENU MOBILE
const menuBtn = document.querySelector(".menu-mobile");
const navLinks = document.querySelector(".nav-links");

if(menuBtn){

    menuBtn.addEventListener("click", () => {

        navLinks.classList.toggle("active");

    });

}

// ANIMAÇÃO AO SCROLL
const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if(entry.isIntersecting){

            entry.target.classList.add("show");

        }

    });

},{
    threshold:0.2
});

document.querySelectorAll(
".benefit-card, .step-card, .glass-card"
).forEach(el => {

    observer.observe(el);

});

// SAUDAÇÃO AUTOMÁTICA
function saudacao(){

    const hora = new Date().getHours();

    if(hora < 12){
        return "Bom dia";
    }

    if(hora < 18){
        return "Boa tarde";
    }

    return "Boa noite";

}

const saudacaoElemento =
document.getElementById("saudacao");

if(saudacaoElemento){

    saudacaoElemento.innerHTML =
    `${saudacao()}, seja bem-vindo ao SICRAI!`;

}

// CONTADOR ANIMADO
function animarNumero(id, valorFinal){

    const elemento =
    document.getElementById(id);

    if(!elemento) return;

    let atual = 0;

    const incremento =
    Math.ceil(valorFinal / 80);

    const intervalo = setInterval(() => {

        atual += incremento;

        if(atual >= valorFinal){

            atual = valorFinal;

            clearInterval(intervalo);

        }

        elemento.textContent =
        atual.toLocaleString("pt-BR");

    },20);

}

// EXEMPLOS
animarNumero("contadorPontos",2450);
animarNumero("contadorLatas",245);

// BOTÃO VOLTAR AO TOPO
const botaoTopo =
document.createElement("button");

botaoTopo.innerHTML =
'<i class="fa-solid fa-arrow-up"></i>';

botaoTopo.classList.add("btn-top");

document.body.appendChild(botaoTopo);

window.addEventListener("scroll", () => {

    if(window.scrollY > 300){

        botaoTopo.style.opacity = "1";

    }else{

        botaoTopo.style.opacity = "0";

    }

});

botaoTopo.addEventListener("click", () => {

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

});

// DARK MODE
const darkButton =
document.getElementById("toggleDark");

if(darkButton){

    darkButton.addEventListener("click", () => {

        document.body.classList.toggle("dark");

        localStorage.setItem(
            "tema",
            document.body.classList.contains("dark")
            ? "dark"
            : "light"
        );

    });

}

window.addEventListener("load", () => {

    const tema =
    localStorage.getItem("tema");

    if(tema === "dark"){

        document.body.classList.add("dark");

    }

});