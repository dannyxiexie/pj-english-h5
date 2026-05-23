import express from "express";
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd();
const app = express();
const port = Number(process.env.PORT || 4173);
const isProduction = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "1mb" }));
app.use(
  "/book-assets/:bookId",
  (req, res, next) => {
    express.static(path.join(root, "books", req.params.bookId, "source", "images"), { maxAge: "1h" })(req, res, next);
  }
);

const localDefinitions = {
  see: "看见；在文中通常指注意到某人或某物。",
  coming: "正在过来；表示某人或某物朝这里移动。",
  busy: "忙着的；没有空做别的事。",
  digging: "挖；用工具或手把土翻开。",
  onion: "洋葱。",
  worm: "虫子；这里指土里的小虫。",
  soldier: "士兵。",
  castle: "城堡。",
  dragon: "龙。",
  afraid: "害怕的。",
  curious: "好奇的。",
  chosen: "被选中的。",
  bold: "勇敢的；大胆的。",
  symbol: "标志；象征。",
  tip: "尖端；末端；小建议；小费。",
  tips: "尖端；末端；小建议；小费。"
};

const usageBank = {
  look: [
    { phrase: "look at", meaning: "看；看着" },
    { phrase: "look for", meaning: "寻找" },
    { phrase: "look after", meaning: "照顾" }
  ],
  take: [
    { phrase: "take care of", meaning: "照顾" },
    { phrase: "take off", meaning: "起飞；脱下" },
    { phrase: "take away", meaning: "拿走" }
  ],
  come: [
    { phrase: "come to", meaning: "来到；总计" },
    { phrase: "come from", meaning: "来自" },
    { phrase: "come back", meaning: "回来" }
  ],
  get: [
    { phrase: "get up", meaning: "起床" },
    { phrase: "get on", meaning: "上车；进展" },
    { phrase: "get away", meaning: "离开；逃脱" }
  ],
  pick: [
    { phrase: "pick up", meaning: "捡起；拿起" },
    { phrase: "pick out", meaning: "挑出；选出" }
  ],
  pull: [
    { phrase: "pull out", meaning: "拔出；拿出" },
    { phrase: "pull up", meaning: "停下；拉起" }
  ],
  run: [
    { phrase: "run out", meaning: "跑出去；用完" },
    { phrase: "run away", meaning: "逃跑" }
  ],
  ride: [
    { phrase: "ride up", meaning: "骑马来到；骑车靠近" },
    { phrase: "ride on", meaning: "骑在上面；继续前进" }
  ],
  climb: [
    { phrase: "climb down", meaning: "爬下来" },
    { phrase: "climb up", meaning: "爬上去" }
  ],
  turn: [
    { phrase: "turn around", meaning: "转身；回头" },
    { phrase: "turn into", meaning: "变成" }
  ],
  come: [
    { phrase: "come to", meaning: "来到；到达" },
    { phrase: "come from", meaning: "来自" },
    { phrase: "come back", meaning: "回来" }
  ],
  speed: [
    { phrase: "speed off", meaning: "快速离开；疾驰而去" }
  ],
  hold: [
    { phrase: "hold on", meaning: "抓紧；坚持一下" },
    { phrase: "hold up", meaning: "举起；支撑" }
  ],
  care: [
    { phrase: "take care of", meaning: "照顾" },
    { phrase: "care about", meaning: "关心；在乎" }
  ],
  afraid: [
    { phrase: "be afraid of", meaning: "害怕" },
    { phrase: "feel afraid", meaning: "感到害怕" }
  ],
  tip: [
    { phrase: "the tip of", meaning: "……的尖端；……的末端" },
    { phrase: "wing tips", meaning: "翅膀尖端" },
    { phrase: "at the tip of", meaning: "在……的尖端" }
  ]
};

const cleanWord = (word = "") => word.toLowerCase().replace(/[^a-z'-]/g, "");

const particles = new Set([
  "about",
  "after",
  "around",
  "at",
  "away",
  "back",
  "down",
  "for",
  "from",
  "in",
  "into",
  "off",
  "of",
  "on",
  "out",
  "over",
  "through",
  "to",
  "up",
  "with"
]);

const usefulPredecessors = new Set(["be", "feel", "get", "look", "take", "make", "become", "seem"]);

const irregularLemmas = {
  chosen: "choose",
  came: "come",
  coming: "come",
  ran: "run",
  ridden: "ride",
  rode: "ride",
  says: "say",
  said: "say",
  sees: "see",
  seen: "see",
  went: "go",
  gone: "go"
};

const uniqueByPhrase = (phrases) => {
  const seen = new Set();
  return phrases.filter((item) => {
    const key = item?.phrase?.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const lemmaCandidates = (word) => {
  const normalized = cleanWord(word);
  const candidates = [normalized];
  if (irregularLemmas[normalized]) candidates.push(irregularLemmas[normalized]);
  if (normalized.endsWith("ies")) candidates.push(`${normalized.slice(0, -3)}y`);
  if (normalized.endsWith("ing") && normalized.length > 5) {
    const stem = normalized.slice(0, -3);
    candidates.push(stem);
    candidates.push(`${stem}e`);
    if (stem.at(-1) === stem.at(-2)) candidates.push(stem.slice(0, -1));
  }
  if (normalized.endsWith("ed") && normalized.length > 4) {
    const stem = normalized.slice(0, -2);
    candidates.push(stem);
    candidates.push(`${stem}e`);
    if (stem.at(-1) === stem.at(-2)) candidates.push(stem.slice(0, -1));
  }
  if (normalized.endsWith("s") && normalized.length > 3) {
    candidates.push(normalized.slice(0, -1));
  }
  return [...new Set(candidates.filter(Boolean))];
};

const bestLemma = (word) =>
  lemmaCandidates(word).find((candidate) => usageBank[candidate]) ||
  lemmaCandidates(word).find((candidate) => localDefinitions[candidate]) ||
  cleanWord(word);

const contextualDefinition = (word, sentence = "") => {
  const normalized = cleanWord(word);
  const lemma = bestLemma(word);
  const lowerSentence = sentence.toLowerCase();

  if ((normalized === "tips" || lemma === "tip") && /wing|wings/.test(lowerSentence)) {
    return "尖端；这里指翅膀的末端、尖尖的部分。";
  }
  if ((normalized === "tips" || lemma === "tip") && /advice|help|idea|how/.test(lowerSentence)) {
    return "建议；小窍门。";
  }

  return localDefinitions[normalized] || localDefinitions[lemma] || `结合这句话，可以先理解为“${word}”在当前语境中的具体动作、事物或状态。`;
};

const sentenceWords = (text = "") => text.match(/[A-Za-z]+(?:['-][A-Za-z]+)?/g) || [];

const phraseFromCurrentSentence = (word, sentence = "") => {
  const selected = cleanWord(word);
  const selectedLemmas = new Set(lemmaCandidates(selected));
  const words = sentenceWords(sentence);
  const lower = words.map((item) => cleanWord(item));
  const index = lower.findIndex((item) => item === selected || selectedLemmas.has(item) || lemmaCandidates(item).includes(selected));
  if (index < 0) return [];

  const next = lower[index + 1];
  const prev = lower[index - 1];
  const rows = [];
  if (particles.has(next)) {
    rows.push({
      phrase: `${words[index]} ${words[index + 1]}`,
      meaning: `本文短语：出现在 “${sentence}” 这句话里。`
    });
  }
  if (particles.has(prev)) {
    rows.push({
      phrase: `${words[index - 1]} ${words[index]}`,
      meaning: `本文短语：出现在 “${sentence}” 这句话里。`
    });
  }
  return rows;
};

const phraseWindowsFromExamples = (word, examples) => {
  const selectedLemmas = new Set(lemmaCandidates(word));
  const rows = [];
  for (const example of examples) {
    const words = sentenceWords(example);
    const lower = words.map((item) => cleanWord(item));
    const index = lower.findIndex((item) => selectedLemmas.has(item) || lemmaCandidates(item).some((candidate) => selectedLemmas.has(candidate)));
    if (index < 0) continue;

    const start = Math.max(0, index - 1);
    const end = Math.min(words.length, index + 3);
    const phrase = words.slice(start, end).join(" ");
    if (phrase.split(" ").length < 2) continue;
    rows.push({
      phrase,
      meaning: `词典例句：${example}`
    });
  }
  return rows;
};

const fetchDictionaryUsage = async (word) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, {
      signal: controller.signal
    });
    if (!response.ok) return { examples: [], phonetic: null, phoneticUs: null };
    const entries = await response.json();
    if (!Array.isArray(entries)) return { examples: [], phonetic: null, phoneticUs: null };
    const examples = entries
      .flatMap((entry) => entry.meanings || [])
      .flatMap((meaning) => meaning.definitions || [])
      .map((definition) => definition.example)
      .filter(Boolean)
      .slice(0, 8);
    const phonetics = entries.flatMap((entry) => entry.phonetics || []);
    const phoneticUs =
      phonetics.find((item) => item.text && /-us\.mp3|us\.mp3|en\/.*-us/i.test(item.audio || ""))?.text ||
      phonetics.find((item) => item.text && /us/i.test(item.sourceUrl || ""))?.text ||
      null;
    const phonetic = phoneticUs || phonetics.find((item) => item.text)?.text || entries[0]?.phonetic || null;
    return { examples, phonetic, phoneticUs };
  } catch {
    return { examples: [], phonetic: null, phoneticUs: null };
  } finally {
    clearTimeout(timeout);
  }
};

const fetchJsonWithTimeout = async (url, ms = 3500) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const fetchDatamuseUsage = async (lemma) => {
  const [followers, predecessors] = await Promise.all([
    fetchJsonWithTimeout(`https://api.datamuse.com/words?rel_bga=${encodeURIComponent(lemma)}&max=8`),
    fetchJsonWithTimeout(`https://api.datamuse.com/words?rel_bgb=${encodeURIComponent(lemma)}&max=8`)
  ]);
  const rows = [];
  for (const item of Array.isArray(followers) ? followers : []) {
    const next = cleanWord(item.word);
    if (particles.has(next)) {
      rows.push({
        phrase: `${lemma} ${next}`,
        meaning: "常见后接用法，来自英文语料统计。"
      });
    }
  }
  for (const item of Array.isArray(predecessors) ? predecessors : []) {
    const prev = cleanWord(item.word);
    if (usefulPredecessors.has(prev)) {
      rows.push({
        phrase: `${prev} ${lemma}`,
        meaning: "常见前接用法，来自英文语料统计。"
      });
    }
  }
  return rows;
};

const enrichUsage = async (payload, base) => {
  const word = String(payload.word || "");
  const normalized = cleanWord(word);
  const lemma = bestLemma(word);
  const currentPhraseRows = phraseFromCurrentSentence(word, payload.sentence);
  const isTipOfWing = lemma === "tip" && /wing|wings/i.test(payload.sentence || "");
  const shouldUseDatamuse = Boolean(usageBank[lemma]) || currentPhraseRows.length > 0;
  const [dictionary, originalDictionary, datamuse] = await Promise.all([
    fetchDictionaryUsage(lemma),
    normalized && normalized !== lemma ? fetchDictionaryUsage(normalized) : Promise.resolve(null),
    shouldUseDatamuse ? fetchDatamuseUsage(lemma) : Promise.resolve([])
  ]);
  const phoneticSource = originalDictionary?.phonetic || originalDictionary?.phoneticUs ? originalDictionary : dictionary;
  const phrases = uniqueByPhrase([
    ...currentPhraseRows,
    ...(usageBank[lemma] || []),
    ...(isTipOfWing ? [] : datamuse),
    ...(isTipOfWing ? [] : phraseWindowsFromExamples(word, dictionary.examples))
  ]).slice(0, 3);

  return {
    ...base,
    normalizedWord: cleanWord(word),
    pronunciationHint: phoneticSource.phonetic ? `音标：${phoneticSource.phonetic}` : base.pronunciationHint,
    phoneticUs: phoneticSource.phoneticUs || base.phoneticUs || "",
    phrases,
    examples: uniqueByPhrase(dictionary.examples.map((example) => ({ phrase: example, meaning: "" })))
      .map((item) => item.phrase)
      .slice(0, 2)
  };
};

const fallbackLookup = ({ word, sentence }) => {
  const normalized = cleanWord(word);
  const lemma = bestLemma(word);
  const definition = contextualDefinition(word, sentence);
  const sentenceCn = sentence
    ? "这句话需要结合前后文理解；先抓住主语、动作和对象，再看这个词在句中承担的意思。"
    : "当前没有可用句子上下文。";

  return {
    word,
    normalizedWord: normalized,
    source: "local-fallback",
    contextualMeaning: definition,
    sentenceTranslation: sentenceCn,
    pronunciationHint: "点击发音按钮播放英文读音。",
    phoneticUs: "",
    phrases: uniqueByPhrase([...phraseFromCurrentSentence(word, sentence), ...(usageBank[lemma] || [])]).slice(0, 3),
    examples: sentence ? [sentence] : []
  };
};

const parseModelJson = (text) => {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  return JSON.parse(candidate.slice(start, end + 1));
};

app.post("/api/lookup", async (req, res) => {
  const payload = req.body ?? {};
  const word = String(payload.word || "").trim();
  if (!word) {
    res.status(400).json({ error: "word is required" });
    return;
  }

  const fallback = await enrichUsage(payload, fallbackLookup(payload));
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;
  if (!apiKey || !model) {
    res.json(fallback);
    return;
  }

  try {
    const apiBase = (process.env.LLM_API_BASE || "https://api.openai.com/v1").replace(/\/$/, "");
    const prompt = [
      "你是一个给中国小学生讲英文分级读物的老师。",
      "请只返回 JSON，不要 Markdown。",
      "字段必须包含：contextualMeaning, sentenceTranslation, pronunciationHint, phrases, examples。",
      "contextualMeaning 用中文解释这个词在当前句子里的意思，优先上下文，不要罗列所有词典义。",
      "phrases 给 0-3 个真实、自然、常见的用法或固定搭配，每项包含 phrase 和 meaning。",
      "不要用 word about、word with、word in 这种模板硬凑；如果没有可靠搭配，phrases 返回空数组。",
      "examples 最多 2 条，优先使用当前句子或非常短的英文例句。",
      "",
      `书名：${payload.bookTitle || ""}`,
      `章节：${payload.chapterTitle || ""}`,
      `单词：${word}`,
      `当前句子：${payload.sentence || ""}`,
      `前文：${payload.before || ""}`,
      `后文：${payload.after || ""}`
    ].join("\n");

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: "Return compact valid JSON only." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) throw new Error(`LLM request failed: ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const parsed = parseModelJson(content);
    res.json({
      ...fallback,
      ...parsed,
      phrases: uniqueByPhrase([...(parsed.phrases || []), ...(fallback.phrases || [])]).slice(0, 3),
      phoneticUs: parsed.phoneticUs || fallback.phoneticUs || "",
      word,
      normalizedWord: cleanWord(word),
      source: "llm+dictionary"
    });
  } catch (error) {
    res.json({
      ...fallback,
      source: "local-fallback",
      warning: error.message
    });
  }
});

app.get("/api/pronunciation", async (req, res) => {
  const word = cleanWord(String(req.query.word || ""));
  if (!word) {
    res.status(400).json({ error: "word is required" });
    return;
  }

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(word)}`;
  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });
    if (!upstream.ok) throw new Error(`TTS failed: ${upstream.status}`);
    const audio = Buffer.from(await upstream.arrayBuffer());
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=604800");
    res.end(audio);
  } catch {
    res.status(204).end();
  }
});

if (isProduction) {
  app.use(express.static(path.join(__dirname, "dist")));
  app.use((_, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Reader running at http://localhost:${port}`);
});
