const data = [
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

let activeUnit = data[0];
let activeSound = data[0].sounds[0];

function buildUnitList() {
  unitListEl.innerHTML = "";
  data.forEach((unit) => {
    const item = document.createElement("button");
    item.className = "unit-item" + (unit.id === activeUnit.id ? " active" : "");
    item.textContent = `${unit.title}`;
    item.addEventListener("click", () => {
      activeUnit = unit;
      activeSound = unit.sounds[0];
      render();
      speakText(activeSound.words[0]);
    });
    unitListEl.appendChild(item);
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

function render() {
  unitHeaderEl.textContent = `${activeUnit.title} · 词汇与发音`;
  buildUnitList();
  buildVocab();
  buildSounds();
  renderDetail();
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

window.speechSynthesis.onvoiceschanged = render;
render();
