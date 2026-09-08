const equipamentos=[
{nome:"Passadeira",categoria:"Cardio",desc:"Corrida e caminhada com velocidade e inclinação ajustáveis",icon:"CARDIO"},
{nome:"Bicicleta",categoria:"Cardio",desc:"Treino cardiovascular de baixo impacto",icon:"CARDIO"},
{nome:"Elíptica",categoria:"Cardio",desc:"Treino cardiovascular de corpo inteiro e baixo impacto",icon:"CARDIO"},
{nome:"Máquina de Remo",categoria:"Cardio",desc:"Trabalho cardiovascular e muscular de corpo inteiro",icon:"CARDIO"},
{nome:"Smith Machine",categoria:"Musculação",desc:"Treino de força guiado com maior estabilidade",icon:"FORÇA"},
{nome:"Banco de Peso",categoria:"Musculação",desc:"Treino com pesos livres e exercícios variados",icon:"FORÇA"},
{nome:"Polia Multifuncional",categoria:"Musculação",desc:"Exercícios de força para diferentes grupos musculares",icon:"FORÇA"},
{nome:"Máquina Abdutora",categoria:"Musculação",desc:"Trabalho específico dos músculos abdutores da anca",icon:"FORÇA"},
{nome:"Máquina Adutora",categoria:"Musculação",desc:"Trabalho específico dos músculos adutores da anca",icon:"FORÇA"},
{nome:"Peso Livre",categoria:"Musculação",desc:"Halteres e cargas livres para treino de força",icon:"FORÇA"},
{nome:"Leg Press",categoria:"Musculação",desc:"Treino de força direcionado aos principais músculos das pernas",icon:"FORÇA"}
];

function renderEquipamentos(filtro="Todos"){
const list=document.getElementById("equipment-list"); if(!list)return;
list.innerHTML=equipamentos.filter(e=>filtro==="Todos"||e.categoria===filtro).map(e=>`<article class="equipment-card"><div class="equipment-icon">${e.icon}</div><div class="equipment-info"><h3>${e.nome}</h3><p>${e.desc}</p><small>${e.categoria}</small></div></article>`).join("");
}
document.addEventListener("click",e=>{const b=e.target.closest(".filter-btn[data-filter]");if(!b)return;document.querySelectorAll("#page-equipment .filter-btn").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderEquipamentos(b.dataset.filter)});
document.addEventListener("DOMContentLoaded",()=>renderEquipamentos());