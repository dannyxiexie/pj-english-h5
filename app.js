const units = [
  {
    id: 1,
    title: "Unit 1",
    vocab: ["watermelon", "grape", "plum", "cherry", "strawberry", "a glass of juice"],
    sounds: [
      { ipa: "/ɑr/", label: "-ar (car)", spelling: "-ar", words: ["car", "farm", "park"] },
      { ipa: "/ɑr/", label: "-ar (park)", spelling: "-ar", words: ["park", "dark", "hard"] },
      { ipa: "/u/", label: "-ue (blue)", spelling: "-ue", words: ["blue", "glue", "cue"] },
      { ipa: "/u/", label: "-oo (school)", spelling: "-oo", words: ["school", "moon", "food"] }
    ]
  },
  {
    id: 2,
    title: "Unit 2",
    vocab: ["hard", "soft", "rough", "smooth", "sharp", "blunt", "thick", "thin", "knife", "pencil", "pencil case"],
    sounds: [
      { ipa: "/ɝ/", label: "-ir (skirt)", spelling: "-ir", words: ["skirt", "bird", "shirt"] },
      { ipa: "/ɝ/", label: "-ur (purse)", spelling: "-ur", words: ["purse", "nurse", "hurt"] },
      { ipa: "/ɔ/", label: "-au (Laura)", spelling: "-au", words: ["Laura", "Paul", "pause"] },
      { ipa: "/ɔr/", label: "-oor (floor)", spelling: "-oor", words: ["floor", "door", "poor"] }
    ]
  },
  {
    id: 3,
    title: "Unit 3",
    vocab: ["hill", "lawn", "path", "bench", "shadow", "the sun", "rise", "high", "at noon", "go down"],
    sounds: [
      { ipa: "/i/", label: "-ee (bee)", spelling: "-ee", words: ["bee", "tree", "see"] },
      { ipa: "/i/", label: "-ea (tea)", spelling: "-ea", words: ["tea", "sea", "pea"] },
      { ipa: "/ɪr/", label: "-eer (deer)", spelling: "-eer", words: ["deer", "peer", "cheer"] },
      { ipa: "/ɛr/", label: "-ear (tear)", spelling: "-ear", words: ["tear", "bear", "pear"] }
    ]
  },
  {
    id: 4,
    title: "Unit 4",
    vocab: ["play football", "play table tennis", "play volleyball", "play badminton", "play basketball", "sport", "poster", "join", "club"],
    sounds: [
      { ipa: "/aɪ/", label: "-i (five)", spelling: "-i", words: ["five", "time", "bike"] },
      { ipa: "/aɪ/", label: "-ie (pie)", spelling: "-ie", words: ["pie", "tie", "die"] }
    ]
  },
  {
    id: 5,
    title: "Unit 5",
    vocab: ["bone", "cat food", "dog food", "fish", "parrot", "tortoise", "cute"],
    sounds: [
      { ipa: "/oʊ/", label: "-oe (Joe)", spelling: "-oe", words: ["Joe", "toe", "roe"] },
      { ipa: "/oʊ/", label: "-oa (goat)", spelling: "-oa", words: ["goat", "boat", "road"] },
      { ipa: "/oʊ/", label: "-o (Flo)", spelling: "-o", words: ["Flo", "go", "no"] }
    ]
  },
  {
    id: 6,
    title: "Unit 6",
    vocab: ["bedroom", "living room", "bathroom", "kitchen", "homework", "model plane", "wash", "dinner"],
    sounds: [
      { ipa: "/ɔɪ/", label: "-oy (toy)", spelling: "-oy", words: ["toy", "boy", "joy"] },
      { ipa: "/ɔɪ/", label: "-oi (noise)", spelling: "-oi", words: ["noise", "coin", "point"] }
    ]
  },
  {
    id: 7,
    title: "Unit 7",
    vocab: ["quiet", "loud", "bell", "television (TV)", "sound", "noisy", "ring", "watch TV"],
    sounds: [
      { ipa: "/ɛr/", label: "-are (square)", spelling: "-are", words: ["square", "care", "share"] },
      { ipa: "/ɛr/", label: "-ear (bear)", spelling: "-ear", words: ["bear", "pear", "wear"] },
      { ipa: "/ɛr/", label: "-air (hair)", spelling: "-air", words: ["hair", "fair", "chair"] }
    ]
  },
  {
    id: 8,
    title: "Unit 8",
    vocab: ["seven o'clock", "a quarter past seven", "half past seven", "a quarter to eight", "get up", "brush my teeth", "wash my face", "have breakfast"],
    sounds: [
      { ipa: "/aʊ/", label: "-ou (mouse)", spelling: "-ou", words: ["mouse", "house", "round"] },
      { ipa: "/aʊ/", label: "-ow (owl)", spelling: "-ow", words: ["owl", "cow", "now"] }
    ]
  },
  {
    id: 9,
    title: "Unit 9",
    vocab: ["always", "usually", "often", "sometimes", "never", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Chinese chess", "see at weekends"],
    sounds: [
      { ipa: "/eɪ/", label: "-ay (May)", spelling: "-ay", words: ["May", "day", "play"] },
      { ipa: "/eɪ/", label: "-ai (wait)", spelling: "-ai", words: ["wait", "rain", "tail"] }
    ]
  }
];

const weaknessData = {
  ordinals: [
    { num: 1, en: "first", short: "第一 1st" },
    { num: 2, en: "second", short: "第二 2nd" },
    { num: 3, en: "third", short: "第三 3rd" },
    { num: 4, en: "fourth", short: "第四 4th" },
    { num: 5, en: "fifth", short: "第五 5th" },
    { num: 6, en: "sixth", short: "第六 6th" },
    { num: 7, en: "seventh", short: "第七 7th" },
    { num: 8, en: "eighth", short: "第八 8th" },
    { num: 9, en: "ninth", short: "第九 9th" },
    { num: 10, en: "tenth", short: "第十 10th" }
  ],
  weekdays: [
    { cn: "星期一", en: "Monday" },
    { cn: "星期二", en: "Tuesday" },
    { cn: "星期三", en: "Wednesday" },
    { cn: "星期四", en: "Thursday" },
    { cn: "星期五", en: "Friday" },
    { cn: "星期六", en: "Saturday" },
    { cn: "星期日", en: "Sunday" }
  ],
  ampm: [
    { cn: "上午", en: "a.m.", example: "9:00 a.m." },
    { cn: "下午 / 晚上", en: "p.m.", example: "7:00 p.m." }
  ]
};

const unitListEl = document.getElementById("unitList");
const unitHeaderEl = document.getElementById("unitHeader");
const vocabListEl = document.getElementById("vocabList");
const soundGridEl = document.getElementById("soundGrid");
const detailIpaEl = document.getElementById("detailIpa");
const detailLabelEl = document.getElementById("detailLabel");
const detailSpellingEl = document.getElementById("detailSpelling");
const detailWordsEl = document.getElementById("detailWords");
const detailPlayBtn = document.getElementById("detailPlay");
const voiceTestBtn = document.getElementById("voiceTest");

const unitViewEl = document.getElementById("unitView");
const weaknessStudyViewEl = document.getElementById("weaknessStudyView");
const weaknessQuizViewEl = document.getElementById("weaknessQuizView");

const ordinalListEl = document.getElementById("ordinalList");
const weekdayListEl = document.getElementById("weekdayList");
const ampmListEl = document.getElementById("ampmList");

const quizTabs = document.querySelectorAll(".tab-btn");
const quizCardEl = document.getElementById("quizCard");
const quizImageEl = document.getElementById("quizImage");
const quizPromptEl = document.getElementById("quizPrompt");
const quizOptionsEl = document.getElementById("quizOptions");
const quizFeedbackEl = document.getElementById("quizFeedback");
const quizNextBtn = document.getElementById("quizNext");

let activeUnit = units[0];
let activeSound = units[0].sounds[0];
let activeView = "unit";
let quizState = { category: "ordinal", question: null };

function buildUnitList() {
  unitListEl.innerHTML = "";
  units.forEach((unit) => {
    const item = document.createElement("button");
    item.className = "unit-item" + (activeView === "unit" && unit.id === activeUnit.id ? " active" : "");
    item.textContent = `${unit.title}`;
    item.addEventListener("click", () => {
      activeUnit = unit;
      activeSound = unit.sounds[0];
      activeView = "unit";
      render();
      speakText(activeSound.words[0]);
    });
    unitListEl.appendChild(item);
  });

  document.querySelectorAll("[data-view]").forEach((btn) => {
    const view = btn.getAttribute("data-view");
    btn.classList.toggle("active", activeView === view);
    btn.onclick = () => {
      activeView = view;
      render();
    };
  });
}

function buildVocab() {
  vocabListEl.innerHTML = "";
  activeUnit.vocab.forEach((word) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = word;
    chip.addEventListener("click", () => speakText(word));
    vocabListEl.appendChild(chip);
  });
}

function buildSounds() {
  soundGridEl.innerHTML = "";
  activeUnit.sounds.forEach((sound) => {
    const card = document.createElement("button");
    card.className = "sound-card";
    const ipa = document.createElement("div");
    ipa.className = "sound-ipa";
    ipa.textContent = sound.ipa;
    const label = document.createElement("div");
    label.className = "sound-label";
    label.textContent = sound.label;
    card.appendChild(ipa);
    card.appendChild(label);
    card.addEventListener("click", () => {
      activeSound = sound;
      renderDetail();
      speakText(sound.words[0]);
    });
    soundGridEl.appendChild(card);
  });
}

function renderDetail() {
  detailIpaEl.textContent = activeSound.ipa;
  detailLabelEl.textContent = activeSound.label;
  detailSpellingEl.textContent = activeSound.spelling;
  detailWordsEl.innerHTML = "";
  activeSound.words.forEach((word) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = word;
    chip.addEventListener("click", () => speakText(word));
    detailWordsEl.appendChild(chip);
  });
}

function renderWeaknessStudy() {
  ordinalListEl.innerHTML = "";
  weaknessData.ordinals.forEach((item) => {
    const card = document.createElement("button");
    card.className = "study-card";
    card.innerHTML = `<div class="study-title">${item.short} - ${item.en}</div><div class="study-sub">序数词</div>`;
    card.addEventListener("click", () => speakText(item.en));
    ordinalListEl.appendChild(card);
  });

  weekdayListEl.innerHTML = "";
  weaknessData.weekdays.forEach((item) => {
    const card = document.createElement("button");
    card.className = "study-card";
    card.innerHTML = `<div class="study-title">${item.cn}</div><div class="study-sub">${item.en}</div>`;
    card.addEventListener("click", () => speakText(item.en));
    weekdayListEl.appendChild(card);
  });

  ampmListEl.innerHTML = "";
  weaknessData.ampm.forEach((item) => {
    const card = document.createElement("button");
    card.className = "study-card";
    card.innerHTML = `<div class="study-title">${item.cn}</div><div class="study-sub">${item.en} · ${item.example}</div>`;
    card.addEventListener("click", () => speakText(item.en));
    ampmListEl.appendChild(card);
  });
}

function renderView() {
  unitViewEl.classList.toggle("hidden", activeView !== "unit");
  weaknessStudyViewEl.classList.toggle("hidden", activeView !== "weakness-study");
  weaknessQuizViewEl.classList.toggle("hidden", activeView !== "weakness-quiz");
}

function renderUnit() {
  unitHeaderEl.textContent = `${activeUnit.title} · 词汇与发音`;
  buildVocab();
  buildSounds();
  renderDetail();
}

function renderQuizTabs() {
  quizTabs.forEach((tab) => {
    const cat = tab.getAttribute("data-quiz");
    tab.classList.toggle("active", cat === quizState.category);
    tab.onclick = () => {
      quizState.category = cat;
      quizState.question = null;
      renderQuiz();
    };
  });
}

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateQuestion(category) {
  if (category === "ordinal") {
    const target = pickRandom(weaknessData.ordinals);
    const options = shuffle([
      target.en,
      ...shuffle(weaknessData.ordinals.filter((o) => o.en !== target.en)).slice(0, 2).map((o) => o.en)
    ]);
    return {
      prompt: `请选择 “${target.short}” 的英文`,
      imageText: target.short,
      answer: target.en,
      options
    };
  }

  if (category === "weekday") {
    const target = pickRandom(weaknessData.weekdays);
    const options = shuffle([
      target.en,
      ...shuffle(weaknessData.weekdays.filter((d) => d.en !== target.en)).slice(0, 2).map((d) => d.en)
    ]);
    return {
      prompt: `请选择 “${target.cn}” 的英文`,
      imageText: "📅",
      answer: target.en,
      options
    };
  }

  const target = pickRandom(weaknessData.ampm);
  const options = shuffle([
    target.en,
    ...shuffle(weaknessData.ampm.filter((a) => a.en !== target.en)).map((a) => a.en)
  ]);
  return {
    prompt: `请选择对应 “${target.cn}” 的缩写`,
    imageText: target.en === "a.m." ? "☀️" : "🌙",
    answer: target.en,
    options
  };
}

function renderQuiz() {
  renderQuizTabs();
  quizFeedbackEl.textContent = "";
  quizOptionsEl.innerHTML = "";
  const question = generateQuestion(quizState.category);
  quizState.question = question;
  quizImageEl.textContent = question.imageText;
  quizPromptEl.textContent = question.prompt;

  question.options.forEach((option) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option";
    btn.textContent = option;
    btn.addEventListener("click", () => {
      if (!quizState.question) return;
      const isCorrect = option === quizState.question.answer;
      btn.classList.add(isCorrect ? "correct" : "wrong");
      quizFeedbackEl.textContent = isCorrect ? "答对啦！" : `再试试，正确答案是 ${quizState.question.answer}`;
      speakText(option);
      quizState.question = null;
    });
    quizOptionsEl.appendChild(btn);
  });
}

function render() {
  renderView();
  buildUnitList();

  if (activeView === "unit") {
    renderUnit();
  }

  if (activeView === "weakness-study") {
    renderWeaknessStudy();
  }

  if (activeView === "weakness-quiz") {
    renderQuiz();
  }
}

function pickUSVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang === "en-US") || voices.find((v) => v.lang.startsWith("en")) || null;
}

function speakText(text) {
  if (!window.speechSynthesis) {
    alert("当前浏览器不支持语音合成功能");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickUSVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

voiceTestBtn.addEventListener("click", () => speakText("Hello, welcome to the phonics demo."));
detailPlayBtn.addEventListener("click", () => speakText(activeSound.words[0]));
quizNextBtn.addEventListener("click", renderQuiz);

window.speechSynthesis.onvoiceschanged = render;
render();
