const ROUNDS = 5;
const shuffle = a => a.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
const pick = (arr, n) => shuffle(arr).slice(0, n);

/* ---------- Voz (Chromebook: speechSynthesis em pt-BR) ---------- */
function speak(t) {
  try {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "pt-BR"; u.rate = 0.85; u.pitch = 1.15;
    speechSynthesis.speak(u);
  } catch (e) {}
}

/* ---------- Conteúdo: 4 temas ---------- */
const COLORS = [
  ["Vermelho", "#e53935"], ["Azul", "#1e66f5"], ["Amarelo", "#f2b705"],
  ["Verde", "#2e9e4f"], ["Laranja", "#ff7a00"], ["Roxo", "#8e44ad"], ["Rosa", "#ff4f9a"]
];
const ANIMALS = [
  ["🐟", "o peixe", "Água"], ["🐙", "o polvo", "Água"], ["🐳", "a baleia", "Água"],
  ["🐒", "o macaco", "Floresta"], ["🦉", "a coruja", "Floresta"], ["🦌", "o cervo", "Floresta"],
  ["🐄", "a vaca", "Fazenda"], ["🐔", "a galinha", "Fazenda"], ["🐖", "o porco", "Fazenda"],
  ["🐧", "o pinguim", "Gelo"], ["🐻‍❄️", "o urso polar", "Gelo"]
];
const HABITATS = { "Água": "🌊", "Floresta": "🌳", "Fazenda": "🏡", "Gelo": "❄️" };
const WORDS = [
  ["⚽", "bola", "B"], ["🏠", "casa", "C"], ["🐱", "gato", "G"], ["☀️", "sol", "S"],
  ["🌙", "lua", "L"], ["🍇", "uva", "U"], ["🐟", "peixe", "P"], ["🍌", "banana", "B"],
  ["🚗", "carro", "C"], ["🌸", "flor", "F"], ["🐘", "elefante", "E"], ["🍎", "maçã", "M"]
];
const LETTERS = "ABCDEFGLMPSU".split("");

const TOPICS = [
  { id: "cores", nome: "Cores", icone: "🎨", cor: "#e5484d", make() {
    return pick(COLORS, ROUNDS).map(([n, hex]) => {
      const others = pick(COLORS.filter(c => c[0] !== n), 2);
      return {
        prompt: "Toque na cor " + n.toUpperCase(),
        say: "Toque na cor " + n,
        vis: "🖍️",
        opts: shuffle([[n, hex, true], ...others.map(o => [o[0], o[1], false])])
          .map(([l, h, ok]) => ({ html: l, bg: h, ok }))
      };
    });
  }},
  { id: "contagem", nome: "Contagem", icone: "🔢", cor: "#3d7bff", make() {
    const icons = ["🍎", "⭐", "🐥", "🎈", "🍓", "🐞"];
    return pick([1, 2, 3, 4, 5, 6, 7, 8, 9], ROUNDS).map(n => {
      const ic = icons[Math.floor(Math.random() * icons.length)];
      const others = pick([1, 2, 3, 4, 5, 6, 7, 8, 9].filter(x => x !== n), 2);
      return {
        prompt: "Quantos tem?",
        say: "Conte comigo. Quantos tem?",
        vis: ic.repeat(n),
        count: n,
        opts: shuffle([[n, true], ...others.map(o => [o, false])]).map(([v, ok]) => ({ html: v, ok }))
      };
    });
  }},
  { id: "animais", nome: "Animais", icone: "🦁", cor: "#35b86b", make() {
    return pick(ANIMALS, ROUNDS).map(([e, nome, hab]) => {
      const others = pick(Object.keys(HABITATS).filter(h => h !== hab), 2);
      return {
        prompt: "Onde vive " + nome + "?",
        say: "Onde vive " + nome + "?",
        vis: e,
        opts: shuffle([[hab, true], ...others.map(o => [o, false])])
          .map(([h, ok]) => ({ html: HABITATS[h] + "<small>" + h + "</small>", ok }))
      };
    });
  }},
  { id: "letras", nome: "Letras", icone: "🔤", cor: "#ff8a3d", make() {
    return pick(WORDS, ROUNDS).map(([e, w, l]) => {
      const others = pick(LETTERS.filter(x => x !== l), 2);
      return {
        prompt: "Com qual letra começa?",
        say: "Com qual letra começa " + w + "?",
        vis: e + '<br><span style="font-size:.4em">' + w + "</span>",
        opts: shuffle([[l, true], ...others.map(o => [o, false])]).map(([v, ok]) => ({ html: v, ok }))
      };
    });
  }}
];

/* ---------- Frases de parabéns ---------- */
const ACERTOS = [
  "Muito bem!", "Parabéns!", "Isso mesmo!", "Você acertou!", "Excelente!",
  "Que demais!", "Mandou bem!", "Arrasou!", "Perfeito!", "Show de bola!",
  "Uau, que esperto!", "Continue assim!", "Você é demais!", "Correto!", "Fantástico!"
];
const FINAL_OTIMO = [
  "Parabéns! Você terminou tudo e foi incrível!", "Uau! Você é um campeão!",
  "Que orgulho! Você acertou quase tudo!", "Você arrasou nas cinco perguntas!"
];
const FINAL_BOM = [
  "Parabéns! Você terminou as cinco perguntas!", "Muito bem! Você foi até o fim!",
  "Que legal! Vamos brincar mais uma vez?", "Você é corajoso! Tente de novo para ganhar mais estrelas!"
];
let ultimaFrase = "";
function sorteia(lista) {
  let f;
  do { f = lista[Math.floor(Math.random() * lista.length)]; } while (f === ultimaFrase && lista.length > 1);
  ultimaFrase = f;
  return f;
}

/* ---------- Interface ---------- */
const $ = id => document.getElementById(id);
let timer = null, lastTopic = null, qs = [], i = 0, score = 0, tries = 0, locked = false;

$("menu").innerHTML = TOPICS.map(t =>
  `<button class="tile" style="--c:${t.cor}" data-id="${t.id}"><span class="big">${t.icone}</span>${t.nome}</button>`
).join("");
$("menu").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  start(TOPICS.find(t => t.id === b.dataset.id));
});
$("back").onclick = () => { clearTimeout(timer); if (window.speechSynthesis) speechSynthesis.cancel(); show("home"); };
$("say").onclick = () => qs[i] && speak(qs[i].say);

function show(w) {
  $("home").classList.toggle("hidden", w !== "home");
  $("game").classList.toggle("hidden", w !== "game");
}
function start(t) {
  lastTopic = t; qs = t.make(); i = 0; score = 0; show("game"); render();
}
function stars() {
  $("stars").textContent = "⭐".repeat(score) + "☆".repeat(ROUNDS - score);
}
function render() {
  if (i >= qs.length) return finish();
  const q = qs[i]; tries = 0; locked = false;
  $("prompt").textContent = q.prompt;
  $("vis").innerHTML = q.vis;
  $("msg").textContent = "";
  stars();
  $("opts").innerHTML = q.opts.map((o, k) =>
    `<button class="opt${o.bg ? " sw" : ""}" data-k="${k}" ${o.bg ? `style="background:${o.bg}"` : ""}>${o.html}</button>`
  ).join("");
  clearTimeout(timer);
  timer = setTimeout(() => speak(q.say), 250);
}
$("opts").addEventListener("click", e => {
  const b = e.target.closest(".opt"); if (!b || locked || b.dataset.k === undefined) return;
  const o = qs[i].opts[+b.dataset.k];
  if (o.ok) {
    locked = true; b.classList.add("ok");
    if (tries === 0) score++;
    stars();
    const frase = sorteia(ACERTOS);
    $("msg").textContent = "🎉 " + frase;
    speak(frase);
    clearTimeout(timer);
    timer = setTimeout(() => { i++; render(); }, 1800);
  } else {
    tries++; b.classList.remove("no"); void b.offsetWidth; b.classList.add("no");
    $("msg").textContent = "💪 Tente de novo!";
    speak("Tente de novo!");
  }
});
function finish() {
  clearTimeout(timer);
  const txt = sorteia(score >= 4 ? FINAL_OTIMO : FINAL_BOM);
  $("prompt").textContent = txt;
  $("vis").innerHTML = "🏆<br>" + "⭐".repeat(score) + "☆".repeat(ROUNDS - score);
  $("opts").innerHTML =
    `<button class="opt" id="again" style="grid-column:1/-1;min-height:90px">🔁 Jogar de novo</button>` +
    `<button class="opt" id="menuBtn" style="grid-column:1/-1;min-height:90px">🏠 Voltar ao menu</button>`;
  $("msg").textContent = "";
  $("stars").textContent = "";
  speak(txt);
  $("again").onclick = () => start(lastTopic);
  $("menuBtn").onclick = () => $("back").onclick();
}
