let timerSeconds=90,timerTotal=90,timerInterval=null,timerRunning=false;
const RING_CIRC=628.3;
function formatTime(s){return `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`}
function updateTimer(){
 const d=document.getElementById("timerDisplay");if(d)d.textContent=formatTime(timerSeconds);
 const ring=document.getElementById("timerRingProgress");
 if(ring){
  const pct=timerTotal>0?Math.max(0,Math.min(1,timerSeconds/timerTotal)):0;
  ring.style.strokeDashoffset=String(RING_CIRC*(1-pct));
 }
 const card=document.getElementById("timerCard");
 const state=document.getElementById("timerState");
 if(card){
  card.classList.toggle("is-ending",timerRunning&&timerSeconds>0&&timerSeconds<=10);
  card.classList.toggle("is-running",timerRunning);
 }
 if(state){
  state.textContent=timerRunning?(timerSeconds<=10?"A terminar":"Em curso"):(timerSeconds===0?"Concluído":"Pronto");
 }
}
function setTimer(s){timerSeconds=Math.max(0,Math.floor(s));timerTotal=Math.max(timerSeconds,1);updateTimer()}
document.addEventListener("DOMContentLoaded",()=>{
 document.querySelectorAll(".timer-presets button").forEach(b=>b.onclick=()=>{
  clearInterval(timerInterval);timerInterval=null;timerRunning=false;
  document.querySelectorAll(".timer-presets button").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");
  const startBtn=document.getElementById("timerStart");
  if(startBtn){startBtn.textContent="Iniciar";startBtn.classList.remove("is-paused")}
  setTimer(+b.dataset.time);
 });
 document.getElementById("setCustomTimer").onclick=()=>{
  let m=Math.max(0,Number(document.getElementById("timerMinutes").value)||0),
      s=Math.min(59,Math.max(0,Number(document.getElementById("timerSeconds").value)||0));
  clearInterval(timerInterval);timerInterval=null;timerRunning=false;
  document.querySelectorAll(".timer-presets button").forEach(x=>x.classList.remove("active"));
  const startBtn=document.getElementById("timerStart");
  if(startBtn){startBtn.textContent="Iniciar";startBtn.classList.remove("is-paused")}
  setTimer(m*60+s);
 };
 document.getElementById("timerStart").onclick=()=>{
  const startBtn=document.getElementById("timerStart");
  const card=document.getElementById("timerCard");
  if(timerRunning){
   clearInterval(timerInterval);timerInterval=null;timerRunning=false;
   if(startBtn){startBtn.textContent="Continuar";startBtn.classList.add("is-paused")}
   updateTimer();
   return;
  }
  if(timerSeconds<=0)return;
  timerRunning=true;
  if(startBtn){startBtn.textContent="Pausar";startBtn.classList.remove("is-paused")}
  updateTimer();
  timerInterval=setInterval(()=>{
   timerSeconds--;updateTimer();
   if(timerSeconds<=0){
    clearInterval(timerInterval);timerInterval=null;timerRunning=false;
    if(startBtn){startBtn.textContent="Iniciar";startBtn.classList.remove("is-paused")}
    if(card){card.classList.add("is-finished");setTimeout(()=>card.classList.remove("is-finished"),1300)}
    if(navigator.vibrate)navigator.vibrate([120,80,120]);
    updateTimer();
   }
  },1000);
 };
 document.getElementById("timerReset").onclick=()=>{
  clearInterval(timerInterval);timerInterval=null;timerRunning=false;
  const startBtn=document.getElementById("timerStart");
  if(startBtn){startBtn.textContent="Iniciar";startBtn.classList.remove("is-paused")}
  const card=document.getElementById("timerCard");
  if(card)card.classList.remove("is-ending","is-finished","is-running");
  setTimer(timerTotal||90);
 };
 setTimer(90);
});
