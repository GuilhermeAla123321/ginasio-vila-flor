/* 50 dicas de treino para a página Timer do Ginásio Municipal de Vila Flor. */
(() => {
  const titleEl = document.getElementById('gymTipsTitle');
  const textEl = document.getElementById('gymTipText');
  const nextButton = document.getElementById('nextGymTip');
  const card = document.getElementById('gymTipsCard');
  if (!titleEl || !textEl || !nextButton || !card) return;

  const tips = [
    { title: 'Começa por aquecer', text: 'Reserva 5 a 10 minutos para uma atividade leve e prepara o corpo antes dos exercícios principais.' },
    { title: 'A técnica vem primeiro', text: 'Executa cada movimento de forma controlada. É melhor usar menos peso e manter uma boa postura.' },
    { title: 'Aumenta a carga aos poucos', text: 'Quando conseguires completar as séries com boa técnica, aumenta a dificuldade gradualmente.' },
    { title: 'Não te esqueças de respirar', text: 'Evita prender a respiração durante todo o exercício. Respira de forma controlada e contínua.' },
    { title: 'Faz séries de aquecimento', text: 'Antes de uma série exigente, experimenta algumas repetições com menos peso para praticar o movimento.' },
    { title: 'Respeita as pausas', text: 'Descansar entre séries ajuda-te a recuperar e a manter a qualidade das repetições seguintes.' },
    { title: 'Bebe água regularmente', text: 'Tem água por perto e bebe pequenas quantidades ao longo do treino, ajustando às tuas necessidades.' },
    { title: 'Escolhe calçado estável', text: 'Usa calçado adequado à atividade, confortável e que te dê estabilidade durante os movimentos.' },
    { title: 'Ajusta a máquina à tua altura', text: 'Antes de começar, regula o banco e os apoios para que o movimento seja confortável e controlado.' },
    { title: 'Planeia a sessão', text: 'Decide com antecedência quais os exercícios que vais fazer para aproveitares melhor o tempo no ginásio.' },
    { title: 'Controla também a descida', text: 'Não deixes o peso cair. Controlar a fase de regresso ajuda-te a fazer o exercício com mais qualidade.' },
    { title: 'Regista o teu progresso', text: 'Anota os pesos, as repetições e como te sentiste. Assim consegues perceber a tua evolução ao longo do tempo.' },
    { title: 'Dá tempo à recuperação', text: 'Os músculos precisam de descanso entre sessões exigentes. Evita treinar intensamente o mesmo grupo muscular todos os dias.' },
    { title: 'Valoriza uma boa noite de sono', text: 'Dormir o suficiente ajuda na recuperação e torna mais fácil manter a regularidade do treino.' },
    { title: 'Come de forma equilibrada', text: 'Inclui alimentos variados nas refeições e adapta a alimentação à tua rotina e às tuas necessidades.' },
    { title: 'Procura uma amplitude confortável', text: 'Move-te numa amplitude que consigas controlar sem forçar as articulações nem perder a postura.' },
    { title: 'Pede ajuda quando precisares', text: 'Se não souberes regular um equipamento ou executar um exercício, pede orientação a um profissional do ginásio.' },
    { title: 'Não treines por cima da dor', text: 'Distingue o esforço muscular de uma dor aguda ou inesperada. Para o exercício se sentires dor e pede orientação.' },
    { title: 'Encontra um ritmo de cardio sustentável', text: 'Começa num ritmo que consigas manter e aumenta a duração ou intensidade progressivamente.' },
    { title: 'Treina o corpo de forma equilibrada', text: 'Organiza a rotina para trabalhar os principais grupos musculares ao longo da semana, de acordo com os teus objetivos.' },
    { title: 'Compara-te contigo', text: 'Cada pessoa tem um ponto de partida diferente. Dá atenção à tua própria evolução e evita comparações desnecessárias.' },
    { title: 'A consistência conta', text: 'Uma rotina realista que consegues cumprir vale mais do que sessões muito exigentes que não consegues manter.' },
    { title: 'Reduz o peso se a técnica falhar', text: 'Se começares a balançar o corpo ou a encurtar o movimento para levantar a carga, ajusta o peso.' },
    { title: 'Deixa o equipamento limpo', text: 'No fim da utilização, limpa as superfícies de contacto de acordo com as regras do ginásio.' },
    { title: 'Arruma os pesos depois de usar', text: 'Devolve halteres, discos e acessórios ao local indicado. Mantém o espaço organizado e seguro para todos.' },
    { title: 'Mantém as passagens livres', text: 'Guarda os objetos pessoais e evita deixar pesos ou garrafas nas zonas de circulação.' },
    { title: 'Partilha o equipamento com respeito', text: 'Se estiveres a descansar entre séries, permite que outras pessoas utilizem a máquina quando for adequado.' },
    { title: 'Começa mais devagar nos dias frios', text: 'Dá alguns minutos extra ao aquecimento quando sentires o corpo mais rígido ou menos preparado.' },
    { title: 'Mantém o tronco estável', text: 'Nos exercícios de força, ativa o tronco de forma confortável e evita movimentos bruscos ou arqueamentos exagerados.' },
    { title: 'Mantém os joelhos alinhados', text: 'Em movimentos como o agachamento, procura que os joelhos acompanhem a direção dos pés, sem forçar a posição.' },
    { title: 'Cuida da posição das costas', text: 'Procura uma posição estável e confortável para a coluna e ajusta o exercício se não a conseguires manter.' },
    { title: 'Usa uma pega confortável', text: 'Segura os acessórios com firmeza, sem apertar em excesso, e escolhe a pega que permite controlar o movimento.' },
    { title: 'Mantém os pulsos alinhados', text: 'Sempre que possível, evita dobrar os pulsos de forma exagerada durante os exercícios com pesos.' },
    { title: 'Evita movimentos bruscos', text: 'Executa as repetições com controlo e sem balanços desnecessários para completar o movimento.' },
    { title: 'Concentra-te num exercício de cada vez', text: 'Foca-te na postura e na execução em vez de tentares acelerar todas as repetições.' },
    { title: 'Adapta o descanso ao exercício', text: 'Exercícios mais exigentes podem pedir pausas maiores. Recupera o suficiente para voltares a executar com segurança.' },
    { title: 'Define um objetivo simples', text: 'Escolhe uma meta concreta para a sessão, como praticar a técnica ou cumprir o plano previsto.' },
    { title: 'Prepara o espaço antes da série', text: 'Confirma a carga, os pinos de segurança e a posição dos acessórios antes de começares.' },
    { title: 'Dá variedade ao treino com intenção', text: 'Altera os exercícios quando fizer sentido para o teu objetivo, sem precisares de mudar toda a rotina constantemente.' },
    { title: 'Alongamentos sem balanços', text: 'Se fizeres alongamentos, entra na posição de forma gradual e evita movimentos bruscos ou dolorosos.' },
    { title: 'Ouve os sinais do corpo', text: 'Se estiveres com tonturas, mal-estar ou falta de ar fora do habitual, interrompe o treino e procura ajuda.' },
    { title: 'Usa o espelho como apoio', text: 'Quando existir um espelho, pode ajudar-te a observar a postura, mas não substitui orientação profissional.' },
    { title: 'Aprende a usar o temporizador', text: 'Define a pausa entre séries para manteres uma rotina organizada, sem apressar a recuperação necessária.' },
    { title: 'Não precisas de treinar até à exaustão', text: 'Terminar uma série com boa técnica e alguma margem pode ser uma opção útil, sobretudo enquanto aprendes.' },
    { title: 'Adapta o treino ao teu nível', text: 'Escolhe uma dificuldade adequada à tua experiência e aumenta-a à medida que ganhas confiança e controlo.' },
    { title: 'Mantém os objetos pessoais por perto, mas fora do caminho', text: 'Coloca a toalha, o telemóvel e a garrafa num local seguro onde não criem obstáculos.' },
    { title: 'Regressa depois de uma pausa com calma', text: 'Após algum tempo sem treinar, recomeça com menor intensidade e progride gradualmente ao longo das sessões.' },
    { title: 'Celebra as pequenas melhorias', text: 'Uma repetição mais controlada, melhor equilíbrio ou maior regularidade também são sinais de progresso.' },
    { title: 'Faz do treino um hábito possível', text: 'Escolhe dias e horários que se adaptem à tua vida para ser mais fácil manter a rotina.' },
    { title: 'Pede um plano ajustado a ti', text: 'Se estás a começar ou tens necessidades específicas, um profissional qualificado pode ajudar-te a adaptar os exercícios.' }
  ];

  let order = [];
  let position = 0;
  let previousTip = -1;

  function shuffledOrder(avoidIndex = -1) {
    const result = tips.map((_, index) => index);
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    if (result.length > 1 && result[0] === avoidIndex) {
      const swapAt = 1 + Math.floor(Math.random() * (result.length - 1));
      [result[0], result[swapAt]] = [result[swapAt], result[0]];
    }
    return result;
  }

  function showTip() {
    const tipIndex = order[position];
    const tip = tips[tipIndex];
    titleEl.textContent = tip.title;
    textEl.textContent = tip.text;
    card.classList.remove('is-changing');
    void card.offsetWidth;
    card.classList.add('is-changing');
    previousTip = tipIndex;
  }

  order = shuffledOrder();
  showTip();

  nextButton.addEventListener('click', () => {
    position += 1;
    if (position >= order.length) {
      order = shuffledOrder(previousTip);
      position = 0;
    }
    showTip();
  });
})();
