import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Archive,
  ArchiveRestore,
  Download,
  ListChecks,
  Palette,
  Play,
  Plus,
  Settings,
  Trash2,
  Upload,
  Volume2,
  X
} from "lucide-react";
import "../styles.css";

const APP_STORAGE_PREFIX = "family-reader:v2";
const LOOKUP_CACHE_VERSION = "lookup-v4";
const LONG_PRESS_MS = 520;

const presets = {
  handheld: {
    label: "手持",
    fontSize: 22,
    lineHeight: 1.75,
    paragraphGap: 18,
    panelWidth: 360
  },
  shared: {
    label: "共读",
    fontSize: 27,
    lineHeight: 1.82,
    paragraphGap: 24,
    panelWidth: 390
  }
};

const orientations = {
  portrait: {
    label: "竖屏",
    pageWidth: 820,
    imageWidth: 92
  },
  landscape: {
    label: "横屏",
    pageWidth: 1180,
    imageWidth: 86
  }
};

const defaultSettings = {
  preset: "shared",
  orientation: "portrait",
  custom: { ...presets.shared, ...orientations.portrait },
  theme: "light",
  showPageNumbers: true,
  autoClosePanel: false
};

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
} else if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

const fullStorageKey = (prefix, key) => `${prefix}:${key}`;

const getStored = (storageKey, fallback) => {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = (storageKey, value) => {
  localStorage.setItem(storageKey, JSON.stringify(value));
};

const normalizeWord = (word = "") => word.toLowerCase().replace(/[^a-z'-]/g, "");
const normalizeColorWord = (word = "") => normalizeWord(word).replace(/(?:'s|')$/i, "");

const hashText = (text = "") => {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const clientFallbackLookup = (word, sentence) => ({
  word,
  normalizedWord: normalizeWord(word),
  source: "instant",
  contextualMeaning: "正在结合上下文确认含义，先不要打断阅读。",
  sentenceTranslation: sentence ? "稍后会显示这句话的中文解释。" : "",
  pronunciationHint: "可以先点发音按钮听英文读音。",
  phoneticUs: "",
  partOfSpeech: "",
  phrases: [],
  examples: sentence ? [sentence] : []
});

const emptyColorList = {
  seededBookId: null,
  entries: {}
};

function useStoredState(key, fallback, prefix = APP_STORAGE_PREFIX) {
  const storageKey = fullStorageKey(prefix, key);
  const [state, setState] = useState(() => ({
    storageKey,
    value: getStored(storageKey, fallback)
  }));

  useEffect(() => {
    setState({
      storageKey,
      value: getStored(storageKey, fallback)
    });
  }, [storageKey]);

  useEffect(() => {
    if (state.storageKey === storageKey) {
      setStored(storageKey, state.value);
    }
  }, [state, storageKey]);

  return [
    state.storageKey === storageKey ? state.value : fallback,
    (nextValue) => {
      setState((current) => ({
        storageKey,
        value: typeof nextValue === "function" ? nextValue(current.storageKey === storageKey ? current.value : fallback) : nextValue
      }));
    }
  ];
}

function App() {
  const [catalog, setCatalog] = useState(null);
  const [selectedBookId, setSelectedBookId] = useStoredState("selectedBookId", null);
  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [view, setView] = useState("reader");
  const bookStoragePrefix = selectedBookId ? `${APP_STORAGE_PREFIX}:books:${selectedBookId}` : `${APP_STORAGE_PREFIX}:books:none`;
  const [settings, setSettings] = useStoredState("displaySettings", defaultSettings, bookStoragePrefix);
  const [colorList, setColorList] = useStoredState("colorList", emptyColorList, bookStoragePrefix);
  const [progress, setProgress] = useStoredState("progress", {}, bookStoragePrefix);
  const [vocabulary, setVocabulary] = useStoredState("vocabulary", {}, bookStoragePrefix);
  const [lookupCache, setLookupCache] = useStoredState("lookupCache", {}, bookStoragePrefix);
  const [lookup, setLookup] = useState(null);
  const [lookupState, setLookupState] = useState("idle");
  const scrollRef = useRef(null);
  const blockRefs = useRef(new Map());
  const longPressRef = useRef(null);
  const restoredRef = useRef(false);

  const displayPresets = {
    handheld: { ...presets.handheld, ...(settings.displayPresets?.handheld || {}) },
    shared: { ...presets.shared, ...(settings.displayPresets?.shared || {}) }
  };
  const activeSettings = settings.preset === "custom" ? settings.custom : displayPresets[settings.preset] || displayPresets.shared;
  const activeOrientation = orientations[settings.orientation] || orientations.portrait;
  const effectiveSettings = {
    ...activeOrientation,
    ...activeSettings,
    pageWidth: settings.preset === "custom" ? settings.custom.pageWidth : activeOrientation.pageWidth,
    imageWidth: settings.preset === "custom" ? settings.custom.imageWidth : activeOrientation.imageWidth
  };

  const colorMap = useMemo(() => {
    const map = new Map();
    for (const entry of Object.values(colorList.entries || {})) {
      const normalized = normalizeColorWord(entry.word);
      if (normalized && entry.color) map.set(normalized, { color: entry.color, label: entry.word });
    }
    return map;
  }, [colorList]);

  useEffect(() => {
    fetch("/data/books/catalog.json")
      .then((response) => response.json())
      .then(setCatalog);
  }, []);

  useEffect(() => {
    if (!book || colorList.seededBookId === book.id) return;
    setColorList((current) => {
      const entries = { ...(current.entries || {}) };
      for (const character of book.characters || []) {
        const names = [character.name, ...(character.aliases || [])];
        for (const name of names) {
          if (String(name).trim().includes(" ")) continue;
          const normalized = normalizeColorWord(name);
          if (!normalized || entries[normalized]) continue;
          entries[normalized] = {
            word: name,
            normalizedWord: normalized,
            color: character.color,
            source: "book-initial"
          };
        }
      }
      return {
        seededBookId: book.id,
        entries
      };
    });
  }, [book, colorList.seededBookId, setColorList]);

  useEffect(() => {
    if (!selectedBookId) {
      setBook(null);
      setChapter(null);
      return;
    }
    const savedProgress = getStored(fullStorageKey(`${APP_STORAGE_PREFIX}:books:${selectedBookId}`, "progress"), {});
    if (savedProgress.chapterId) setProgress(savedProgress);
    setBook(null);
    setChapter(null);
    setLookup(null);
    setView("reader");
    fetch(`/data/books/${selectedBookId}/book.json`)
      .then((response) => response.json())
      .then((data) => {
        setBook(data);
        const savedIndex = data.chapters.findIndex((item) => item.id === savedProgress.chapterId);
        setChapterIndex(savedIndex >= 0 ? savedIndex : 0);
      });
  }, [selectedBookId]);

  useEffect(() => {
    if (!book) return;
    const chapterMeta = book.chapters[chapterIndex];
    restoredRef.current = false;
    fetch(`/data/books/${book.id}/${chapterMeta.href}`)
      .then((response) => response.json())
      .then(setChapter);
  }, [book, chapterIndex]);

  useEffect(() => {
    if (!chapter || restoredRef.current || !scrollRef.current) return;
    restoredRef.current = true;
    const shouldRestore = progress.chapterId === chapter.id;
    requestAnimationFrame(() => {
      if (shouldRestore && progress.blockId && blockRefs.current.has(progress.blockId)) {
        blockRefs.current.get(progress.blockId)?.scrollIntoView({ block: "start" });
        scrollRef.current?.scrollBy({ top: -24 });
        return;
      }
      scrollRef.current?.scrollTo({ top: shouldRestore ? progress.scrollOffset || 0 : 0 });
      if (!shouldRestore) {
        setProgress({
          bookId: book.id,
          chapterId: chapter.id,
          blockId: chapter.blocks[0]?.id ?? null,
          scrollOffset: 0,
          updatedAt: new Date().toISOString()
        });
      }
    });
  }, [book, chapter, progress.chapterId, progress.scrollOffset, setProgress]);

  const sentenceIndex = useMemo(() => {
    if (!chapter) return [];
    const rows = [];
    for (const block of chapter.blocks) {
      if (block.type !== "paragraph") continue;
      for (const sentence of block.sentences) {
        rows.push({ ...sentence, blockId: block.id, page: block.page });
      }
    }
    return rows;
  }, [chapter]);

  const appStyle = {
    "--reader-font-size": `${effectiveSettings.fontSize}px`,
    "--reader-line-height": effectiveSettings.lineHeight,
    "--paragraph-gap": `${effectiveSettings.paragraphGap}px`,
    "--page-width": `${effectiveSettings.pageWidth}px`,
    "--image-width": `${effectiveSettings.imageWidth}%`,
    "--panel-width": `${effectiveSettings.panelWidth}px`
  };

  const saveProgress = useCallback(() => {
    if (!chapter || !scrollRef.current) return;
    const scrollEl = scrollRef.current;
    let currentBlockId = chapter.blocks[0]?.id ?? null;
    for (const block of chapter.blocks) {
      const element = blockRefs.current.get(block.id);
      if (!element) continue;
      if (element.offsetTop <= scrollEl.scrollTop + 120) currentBlockId = block.id;
    }
    setProgress({
      bookId: book.id,
      chapterId: chapter.id,
      blockId: currentBlockId,
      scrollOffset: scrollEl.scrollTop,
      updatedAt: new Date().toISOString()
    });
  }, [book, chapter, setProgress]);

  const getContext = useCallback(
    (sentenceId) => {
      const index = sentenceIndex.findIndex((item) => item.sentenceId === sentenceId);
      const current = sentenceIndex[index];
      return {
        sentence: current?.text || "",
        before: sentenceIndex[index - 1]?.text || "",
        after: sentenceIndex[index + 1]?.text || "",
        page: current?.page ?? null
      };
    },
    [sentenceIndex]
  );

  const openLookup = useCallback(
    async ({ word, sentenceId }) => {
      if (!book || !chapter) return;
      const context = getContext(sentenceId);
      const normalized = normalizeWord(word);
      const cacheKey = `${LOOKUP_CACHE_VERSION}:${normalized}:${hashText(context.sentence)}`;
      const cached = lookupCache[cacheKey];
      setView("reader");
      setLookup({
        word,
        normalized,
        context,
        data: cached || clientFallbackLookup(word, context.sentence),
        meaningFlag: true,
        pronunciationFlag: true
      });
      if (cached) {
        setLookupState("ready");
        return;
      }
      setLookupState("loading");

      try {
        const response = await fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word,
            sentence: context.sentence,
            before: context.before,
            after: context.after,
            bookTitle: book.title,
            chapterTitle: chapter.title
          })
        });
        const data = await response.json();
        setLookup((current) => (current ? { ...current, data } : current));
        setLookupCache((current) => ({ ...current, [cacheKey]: data }));
        setLookupState("ready");
      } catch {
        setLookupState("ready");
      }
    },
    [book, chapter, getContext, lookupCache, setLookupCache]
  );

  const beginLongPress = (event, word, sentenceId) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    event.currentTarget.setPointerCapture?.(pointerId);
    longPressRef.current = {
      pointerId,
      timer: window.setTimeout(() => {
        longPressRef.current = null;
        openLookup({ word, sentenceId });
      }, LONG_PRESS_MS),
      startX,
      startY
    };
  };

  const cancelLongPress = (event) => {
    const state = longPressRef.current;
    if (!state) return;
    if (event.type === "pointermove") {
      const distance = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
      if (distance < 12) return;
    }
    window.clearTimeout(state.timer);
    longPressRef.current = null;
  };

  const changeChapter = (nextIndex) => {
    saveProgress();
    setChapterIndex(Math.max(0, Math.min(book.chapters.length - 1, nextIndex)));
    setLookup(null);
  };

  const collectWord = () => {
    if (!lookup) return;
    const key = lookup.normalized;
    const now = new Date().toISOString();
    const previous = vocabulary[key];
    const next = {
      word: lookup.word,
      normalizedWord: key,
      contextualMeaning: lookup.data.contextualMeaning,
      sentence: lookup.context.sentence,
      sentenceTranslation: lookup.data.sentenceTranslation,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      page: lookup.context.page,
      firstCollectedAt: previous?.firstCollectedAt || now,
      lastCollectedAt: now,
      totalCount: (previous?.totalCount || 0) + 1,
      meaningCount: (previous?.meaningCount || 0) + (lookup.meaningFlag ? 1 : 0),
      pronunciationCount: (previous?.pronunciationCount || 0) + (lookup.pronunciationFlag ? 1 : 0),
      phoneticUs: lookup.data.phoneticUs || previous?.phoneticUs || "",
      partOfSpeech: lookup.data.partOfSpeech || previous?.partOfSpeech || "",
      archivedAt: null,
      phrases: lookup.data.phrases || [],
      history: [
        ...(previous?.history || []),
        {
          at: now,
          meaning: lookup.meaningFlag,
          pronunciation: lookup.pronunciationFlag,
          sentence: lookup.context.sentence,
          page: lookup.context.page,
          chapterTitle: chapter.title
        }
      ].slice(-20)
    };
    setVocabulary((current) => ({ ...current, [key]: next }));
    setLookup((current) => (current ? { ...current, justCollected: next.totalCount } : current));
  };

  const playPronunciation = async (word) => {
    const audio = new Audio(`/api/pronunciation?word=${encodeURIComponent(word)}`);
    try {
      await audio.play();
    } catch {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      window.speechSynthesis?.speak(utterance);
    }
  };

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      bookId: book?.id,
      progress,
      displaySettings: settings,
      colorList,
      vocabulary,
      lookupCache
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `family-english-reader-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file) => {
    if (!file) return;
    const data = JSON.parse(await file.text());
    if (data.progress) setProgress(data.progress);
    if (data.displaySettings) setSettings(data.displaySettings);
    if (data.colorList) setColorList(data.colorList);
    if (data.vocabulary) setVocabulary(data.vocabulary);
    if (data.lookupCache) setLookupCache(data.lookupCache);
  };

  if (!catalog) {
    return (
      <main className="loading-screen">
        <BookOpen size={34} />
        <p>正在打开书架</p>
      </main>
    );
  }

  if (!selectedBookId || !book) {
    return (
      <Bookshelf
        catalog={catalog}
        onOpen={(bookId) => setSelectedBookId(bookId)}
      />
    );
  }

  if (!chapter) {
    return (
      <main className={`loading-screen theme-${settings.theme || "light"}`}>
        <BookOpen size={34} />
        <p>正在打开电子书</p>
      </main>
    );
  }

  return (
    <div className={`app view-${view} theme-${settings.theme || "light"} orientation-${settings.orientation || "portrait"}`} style={appStyle}>
      <header className="app-header">
        <div className="brand">
          <BookOpen size={24} />
          <div>
            <strong>{book.title}</strong>
            <span>{chapter.title}</span>
          </div>
        </div>
        <nav className="top-tabs" aria-label="主要页面">
          <button onClick={() => setSelectedBookId(null)}>
            <BookOpen size={18} /> 书架
          </button>
          <button className={view === "reader" ? "active" : ""} onClick={() => setView("reader")}>
            <BookOpen size={18} /> 阅读
          </button>
          <button className={view === "vocab" ? "active" : ""} onClick={() => setView("vocab")}>
            <ListChecks size={18} /> 生词本
          </button>
          <button className={view === "colors" ? "active" : ""} onClick={() => setView("colors")}>
            <Palette size={18} /> 颜色清单
          </button>
          <button className={view === "settings" ? "active" : ""} onClick={() => setView("settings")}>
            <Settings size={18} /> 设置
          </button>
        </nav>
      </header>

      {view === "reader" && (
        <main className={`reader-shell ${lookup ? "has-lookup" : ""}`}>
          <section className="reader-main">
            <div className="reader-controls">
              <button onClick={() => changeChapter(chapterIndex - 1)} disabled={chapterIndex === 0}>
                <ChevronLeft size={18} /> 上一章
              </button>
              <select value={chapterIndex} onChange={(event) => changeChapter(Number(event.target.value))}>
                {book.chapters.map((item, index) => (
                  <option key={item.id} value={index}>
                    {item.title}
                  </option>
                ))}
              </select>
              <button onClick={() => changeChapter(chapterIndex + 1)} disabled={chapterIndex === book.chapters.length - 1}>
                下一章 <ChevronRight size={18} />
              </button>
              <div className="preset-group">
                {Object.entries(orientations).map(([key, item]) => (
                  <button
                    key={key}
                    className={settings.orientation === key ? "active" : ""}
                    onClick={() => setSettings((current) => ({ ...current, orientation: key }))}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="preset-group">
                {Object.entries(presets).map(([key, preset]) => (
                  <button
                    key={key}
                    className={settings.preset === key ? "active" : ""}
                    onClick={() => setSettings((current) => ({ ...current, preset: key }))}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <article className="reader-scroll" ref={scrollRef} onScroll={saveProgress}>
              <div className="book-page">
                <h1>{chapter.title}</h1>
                {chapter.blocks.map((block) => (
                  <Block
                    key={block.id}
                    block={block}
                    settings={settings}
                    blockRefs={blockRefs}
                    colorMap={colorMap}
                    vocabulary={vocabulary}
                    onWordDown={beginLongPress}
                    onWordCancel={cancelLongPress}
                  />
                ))}
              </div>
            </article>
          </section>
          {lookup && (
            <LookupPanel
              lookup={lookup}
              lookupState={lookupState}
              vocabulary={vocabulary}
              onClose={() => setLookup(null)}
              onCollect={collectWord}
              onPlay={playPronunciation}
              onToggle={(field, value) => setLookup((current) => (current ? { ...current, [field]: value } : current))}
            />
          )}
        </main>
      )}

      {view === "vocab" && <VocabularyPage vocabulary={vocabulary} setVocabulary={setVocabulary} onPlay={playPronunciation} />}
      {view === "colors" && <ColorListPage colorList={colorList} setColorList={setColorList} />}
      {view === "settings" && (
        <SettingsPage
          settings={settings}
          setSettings={setSettings}
          progress={progress}
          vocabulary={vocabulary}
          onExport={exportData}
          onImport={importData}
        />
      )}
    </div>
  );
}

function Bookshelf({ catalog, onOpen }) {
  return (
    <div className="app bookshelf-app theme-light">
      <header className="app-header">
        <div className="brand">
          <BookOpen size={24} />
          <div>
            <strong>Family English Reader</strong>
            <span>选择一本书开始阅读</span>
          </div>
        </div>
      </header>
      <main className="bookshelf">
        <section className="bookshelf-hero">
          <h1>书架</h1>
          <p>每本书都有独立进度、生词本、查词缓存和显示设置。</p>
        </section>
        <section className="book-grid" aria-label="可阅读书籍">
          {(catalog.books || []).map((item) => (
            <article className="book-card" key={item.id}>
              <div className="book-cover">
                <img src={item.cover} alt={`${item.title} cover`} />
              </div>
              <div className="book-card-body">
                <h2>{item.title}</h2>
                {item.subtitle && <p>{item.subtitle}</p>}
                <span>{item.chapterCount} 个章节</span>
                <button className="primary-button" onClick={() => onOpen(item.id)}>
                  <BookOpen size={18} /> 打开
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function Block({ block, settings, blockRefs, colorMap, vocabulary, onWordDown, onWordCancel }) {
  const register = (element) => {
    if (element) blockRefs.current.set(block.id, element);
  };

  if (block.type === "image") {
    if (block.missing) {
      return (
        <figure className="illustration-block missing-illustration" data-block-id={block.id} ref={register}>
          <div>
            <strong>{block.alt || `Page ${block.page} illustration`}</strong>
            <span>这页图片文件还没有放回书籍图片目录。</span>
          </div>
        </figure>
      );
    }
    return (
      <figure className="illustration-block" data-block-id={block.id} ref={register}>
        <img src={block.src} alt={block.alt} loading="lazy" />
      </figure>
    );
  }

  if (block.type === "pageBreak") {
    return settings.showPageNumbers ? (
      <div className="page-break" data-block-id={block.id} ref={register}>
        {block.label}
      </div>
    ) : (
      <span data-block-id={block.id} ref={register} />
    );
  }

  if (block.type === "heading") {
    return (
      <h2 data-block-id={block.id} ref={register}>
        {block.text}
      </h2>
    );
  }

  return (
    <p className="paragraph-block" data-block-id={block.id} ref={register}>
      {block.sentences.map((sentence) => (
        <span className="sentence" key={sentence.sentenceId}>
          {sentence.tokens.map((token, index) => {
            if (token.type !== "word") return <span key={`${sentence.sentenceId}-${index}`}>{token.value}</span>;
            const normalized = normalizeColorWord(token.value);
            const colorEntry = colorMap.get(normalized);
            const isCollected = Boolean(vocabulary[normalizeWord(token.value)]);
            return (
              <span
                className={`word-token ${colorEntry ? "color-list-token" : ""} ${isCollected ? "collected-token" : ""}`}
                style={colorEntry ? { "--word-color": colorEntry.color } : undefined}
                title={colorEntry ? `颜色清单：${colorEntry.label}` : undefined}
                key={`${sentence.sentenceId}-${token.tokenId}`}
                onPointerDown={(event) => onWordDown(event, token.value, sentence.sentenceId)}
                onPointerUp={onWordCancel}
                onPointerCancel={onWordCancel}
                onPointerLeave={onWordCancel}
                onPointerMove={onWordCancel}
              >
                {token.value}
              </span>
            );
          })}
        </span>
      ))}
    </p>
  );
}

function LookupPanel({ lookup, lookupState, vocabulary, onClose, onCollect, onPlay, onToggle }) {
  const existing = vocabulary[lookup.normalized];
  const data = lookup.data;
  const collectLabel = existing ? "再次收录" : "收录";

  return (
    <aside className="lookup-panel">
      <div className="panel-head">
        <div>
          <span className="panel-kicker">{lookupState === "loading" ? "正在补充上下文解释" : data.source?.includes("llm") ? "上下文解释" : "快速解释"}</span>
          <h2>{lookup.word}</h2>
          {(data.phoneticUs || data.partOfSpeech) && (
            <p className="phonetic-line">
              {data.phoneticUs ? `美式 ${data.phoneticUs}` : ""}
              {data.phoneticUs && data.partOfSpeech ? " · " : ""}
              {data.partOfSpeech ? `词性 ${data.partOfSpeech}` : ""}
            </p>
          )}
        </div>
        <button className="icon-button" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>
      </div>

      <button className="audio-button" onClick={() => onPlay(lookup.word)}>
        <Volume2 size={20} /> 播放发音
      </button>

      <section className="meaning-card">
        <label>本文含义</label>
        <p>{data.contextualMeaning}</p>
      </section>

      <section className="sentence-card">
        <label>原句</label>
        <p className="english-sentence">{lookup.context.sentence}</p>
        <p>{data.sentenceTranslation}</p>
      </section>

      <section className="collect-box">
        <div className="checkbox-row">
          <label>
            <input type="checkbox" checked={lookup.meaningFlag} onChange={(event) => onToggle("meaningFlag", event.target.checked)} />
            含义
          </label>
          <label>
            <input
              type="checkbox"
              checked={lookup.pronunciationFlag}
              onChange={(event) => onToggle("pronunciationFlag", event.target.checked)}
            />
            发音
          </label>
        </div>
        <button className="primary-button" onClick={onCollect}>
          <ListChecks size={18} /> {collectLabel}
        </button>
        {lookup.justCollected && <p className="count-hint">已收录 {lookup.justCollected} 次</p>}
        {existing && !lookup.justCollected && (
          <p className="count-hint">
            已收录 {existing.totalCount} 次 · 含义 {existing.meaningCount} · 发音 {existing.pronunciationCount}
          </p>
        )}
      </section>

      <section className="phrases">
        <label>常用用法</label>
        {(data.phrases || []).length ? (
          (data.phrases || []).slice(0, 3).map((item) => (
            <div className="phrase-row" key={`${item.phrase}-${item.meaning}`}>
              <strong>{item.phrase}</strong>
              <span>{item.meaning}</span>
            </div>
          ))
        ) : (
          <p className="empty-usage">暂时没有可靠的固定搭配。</p>
        )}
      </section>
    </aside>
  );
}

function VocabularyPage({ vocabulary, setVocabulary, onPlay }) {
  const [filter, setFilter] = useState("active");
  const entries = Object.values(vocabulary).sort((a, b) => new Date(b.lastCollectedAt) - new Date(a.lastCollectedAt));
  const filtered = entries.filter((entry) => {
    const isArchived = Boolean(entry.archivedAt);
    if (filter === "active") return !isArchived;
    if (filter === "archived") return isArchived;
    if (filter === "meaning") return !isArchived && entry.meaningCount > 0;
    if (filter === "pronunciation") return !isArchived && entry.pronunciationCount > 0;
    return true;
  });
  const activeCount = entries.filter((entry) => !entry.archivedAt).length;
  const archivedCount = entries.length - activeCount;

  const setArchived = (entry, archived) => {
    setVocabulary((current) => ({
      ...current,
      [entry.normalizedWord]: {
        ...current[entry.normalizedWord],
        archivedAt: archived ? new Date().toISOString() : null
      }
    }));
  };
  const deleteEntry = (entry) => {
    if (!entry.archivedAt) return;
    if (!window.confirm(`确认删除 ${entry.word}？删除后只能通过重新收录恢复。`)) return;
    setVocabulary((current) => {
      const next = { ...current };
      delete next[entry.normalizedWord];
      return next;
    });
  };

  return (
    <main className="page-view">
      <div className="page-title">
        <h1>生词本</h1>
        <p>
          {activeCount} 个在学
          {archivedCount ? ` · ${archivedCount} 个已归档` : ""}
        </p>
      </div>
      <div className="filter-tabs">
        {[
          ["active", "在学"],
          ["all", "全部"],
          ["meaning", "含义"],
          ["pronunciation", "发音"],
          ["archived", "已归档"]
        ].map(([key, label]) => (
          <button key={key} className={filter === key ? "active" : ""} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className="vocab-grid">
        {filtered.map((entry) => (
          <article className="vocab-card" key={entry.normalizedWord}>
            <div className="vocab-card-head">
              <div>
                <h2>{entry.word}</h2>
                {entry.archivedAt && <span className="archive-badge">已归档</span>}
              </div>
              <div className="vocab-actions">
                <button className="icon-button" onClick={() => onPlay(entry.word)} aria-label="播放发音">
                  <Play size={18} />
                </button>
                {entry.archivedAt ? (
                  <button className="icon-button" onClick={() => setArchived(entry, false)} aria-label="恢复到在学">
                    <ArchiveRestore size={18} />
                  </button>
                ) : (
                  <button className="icon-button" onClick={() => setArchived(entry, true)} aria-label="归档">
                    <Archive size={18} />
                  </button>
                )}
                {entry.archivedAt && (
                  <button className="icon-button danger-button" onClick={() => deleteEntry(entry)} aria-label="删除">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
            {(entry.phoneticUs || entry.partOfSpeech) && (
              <p className="vocab-phonetic">
                {entry.phoneticUs ? `美式 ${entry.phoneticUs}` : ""}
                {entry.phoneticUs && entry.partOfSpeech ? " · " : ""}
                {entry.partOfSpeech ? `词性 ${entry.partOfSpeech}` : ""}
              </p>
            )}
            <p>{entry.contextualMeaning}</p>
            <p className="english-sentence">{entry.sentence}</p>
            <div className="vocab-meta">
              <span>总计 {entry.totalCount}</span>
              <span>含义 {entry.meaningCount}</span>
              <span>发音 {entry.pronunciationCount}</span>
            </div>
            <small>
              {entry.chapterTitle}
              {entry.page ? ` · Page ${entry.page}` : ""}
            </small>
          </article>
        ))}
      </div>
    </main>
  );
}

function ColorListPage({ colorList, setColorList }) {
  const [word, setWord] = useState("");
  const [color, setColor] = useState("#1f6f68");
  const entries = Object.values(colorList.entries || {}).sort((a, b) => a.word.localeCompare(b.word));

  const addEntry = (event) => {
    event.preventDefault();
    const normalized = normalizeColorWord(word);
    if (!normalized) return;
    setColorList((current) => ({
      ...current,
      entries: {
        ...(current.entries || {}),
        [normalized]: {
          word: word.trim(),
          normalizedWord: normalized,
          color,
          source: "manual"
        }
      }
    }));
    setWord("");
  };

  const updateEntry = (entry, nextColor) => {
    setColorList((current) => ({
      ...current,
      entries: {
        ...(current.entries || {}),
        [entry.normalizedWord]: {
          ...entry,
          color: nextColor,
          source: entry.source || "manual"
        }
      }
    }));
  };

  const deleteEntry = (entry) => {
    setColorList((current) => {
      const entriesNext = { ...(current.entries || {}) };
      delete entriesNext[entry.normalizedWord];
      return {
        ...current,
        entries: entriesNext
      };
    });
  };

  return (
    <main className="page-view color-list-page">
      <div className="page-title">
        <h1>颜色清单</h1>
        <p>{entries.length} 个词会按指定颜色显示</p>
      </div>

      <section className="settings-section">
        <h2>添加单词</h2>
        <form className="color-add-form" onSubmit={addEntry}>
          <input value={word} onChange={(event) => setWord(event.target.value)} placeholder="输入英文单词" />
          <input type="color" value={color} onChange={(event) => setColor(event.target.value)} aria-label="选择颜色" />
          <button className="primary-button" type="submit">
            <Plus size={18} /> 添加
          </button>
        </form>
      </section>

      <section className="settings-section">
        <h2>清单</h2>
        <div className="color-settings">
          {entries.map((entry) => (
            <label className="color-row" key={entry.normalizedWord}>
              <span style={{ "--word-color": entry.color }}>
                <i />
                {entry.word}
              </span>
              <input type="color" value={entry.color} onChange={(event) => updateEntry(entry, event.target.value)} />
              <button className="icon-button danger-button" type="button" onClick={() => deleteEntry(entry)} aria-label="删除">
                <Trash2 size={18} />
              </button>
            </label>
          ))}
        </div>
      </section>
    </main>
  );
}

function SettingsPage({ settings, setSettings, progress, vocabulary, onExport, onImport }) {
  const custom = settings.custom;
  const displayPresets = {
    handheld: { ...presets.handheld, ...(settings.displayPresets?.handheld || {}) },
    shared: { ...presets.shared, ...(settings.displayPresets?.shared || {}) }
  };
  const updateCustom = (key, value) => {
    setSettings((current) => ({
      ...current,
      preset: "custom",
      custom: { ...current.custom, [key]: value }
    }));
  };
  const updatePreset = (presetKey, field, value) => {
    setSettings((current) => ({
      ...current,
      displayPresets: {
        ...(current.displayPresets || {}),
        [presetKey]: {
          ...presets[presetKey],
          ...(current.displayPresets?.[presetKey] || {}),
          [field]: value
        }
      }
    }));
  };

  return (
    <main className="page-view settings-page">
      <div className="page-title">
        <h1>显示与备份</h1>
        <p>平时用预设，需要时在这里细调</p>
      </div>

      <section className="settings-section">
        <h2>阅读预设</h2>
        <div className="preset-large">
          {Object.entries(orientations).map(([key, item]) => (
            <button
              key={key}
              className={settings.orientation === key ? "active" : ""}
              onClick={() => setSettings((current) => ({ ...current, orientation: key }))}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="preset-large">
          {Object.entries(presets).map(([key, preset]) => (
            <button key={key} className={settings.preset === key ? "active" : ""} onClick={() => setSettings((current) => ({ ...current, preset: key }))}>
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>配色方案</h2>
        <div className="theme-options">
          {[
            ["light", "白色", "干净明亮，适合白天阅读"],
            ["dark", "深色", "暗光环境更舒服"],
            ["magic", "魔法", "彩色、有中世纪魔法小说感"]
          ].map(([key, label, desc]) => (
            <button
              key={key}
              className={`theme-choice theme-swatch-${key} ${settings.theme === key ? "active" : ""}`}
              onClick={() => setSettings((current) => ({ ...current, theme: key }))}
            >
              <span>{label}</span>
              <small>{desc}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2>手持模式</h2>
        <Slider label="正文字号" value={displayPresets.handheld.fontSize} min={18} max={42} unit="px" onChange={(value) => updatePreset("handheld", "fontSize", value)} />
        <Slider label="行距" value={displayPresets.handheld.lineHeight} min={1.45} max={2.2} step={0.05} onChange={(value) => updatePreset("handheld", "lineHeight", value)} />
        <Slider label="段落间距" value={displayPresets.handheld.paragraphGap} min={10} max={42} unit="px" onChange={(value) => updatePreset("handheld", "paragraphGap", value)} />
      </section>

      <section className="settings-section">
        <h2>共读模式</h2>
        <Slider label="正文字号" value={displayPresets.shared.fontSize} min={18} max={42} unit="px" onChange={(value) => updatePreset("shared", "fontSize", value)} />
        <Slider label="行距" value={displayPresets.shared.lineHeight} min={1.45} max={2.2} step={0.05} onChange={(value) => updatePreset("shared", "lineHeight", value)} />
        <Slider label="段落间距" value={displayPresets.shared.paragraphGap} min={10} max={42} unit="px" onChange={(value) => updatePreset("shared", "paragraphGap", value)} />
      </section>

      <section className="settings-section">
        <h2>高级显示</h2>
        <Slider label="正文字号" value={custom.fontSize} min={18} max={42} unit="px" onChange={(value) => updateCustom("fontSize", value)} />
        <Slider label="行距" value={custom.lineHeight} min={1.45} max={2.2} step={0.05} onChange={(value) => updateCustom("lineHeight", value)} />
        <Slider label="段落间距" value={custom.paragraphGap} min={10} max={42} unit="px" onChange={(value) => updateCustom("paragraphGap", value)} />
        <Slider label="页面宽度" value={custom.pageWidth} min={620} max={1280} unit="px" onChange={(value) => updateCustom("pageWidth", value)} />
        <Slider label="图片宽度" value={custom.imageWidth} min={50} max={100} unit="%" onChange={(value) => updateCustom("imageWidth", value)} />
        <Slider label="右侧面板" value={custom.panelWidth} min={320} max={520} unit="px" onChange={(value) => updateCustom("panelWidth", value)} />
        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.showPageNumbers}
            onChange={(event) => setSettings((current) => ({ ...current, showPageNumbers: event.target.checked }))}
          />
          显示原 PDF 页码
        </label>
      </section>

      <section className="settings-section">
        <h2>进度与备份</h2>
        <p className="status-line">
          已保存到 {progress.chapterId || "尚未开始"} · 在学生词{" "}
          {Object.values(vocabulary).filter((entry) => !entry.archivedAt).length} 个
        </p>
        <div className="backup-actions">
          <button onClick={onExport}>
            <Download size={18} /> 导出数据
          </button>
          <label className="file-button">
            <Upload size={18} /> 导入数据
            <input type="file" accept="application/json" onChange={(event) => onImport(event.target.files?.[0])} />
          </label>
        </div>
      </section>
    </main>
  );
}

function Slider({ label, value, min, max, step = 1, unit = "", onChange }) {
  return (
    <label className="slider-row">
      <span>
        {label}
        <strong>
          {value}
          {unit}
        </strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export default App;
