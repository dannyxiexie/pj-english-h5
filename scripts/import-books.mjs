import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const booksRoot = path.join(root, "books");
const outputRoot = path.join(root, "public", "data", "books");

const defaultBookMeta = {
  id: "dragon-master",
  title: "Dragon Masters: Rise of the Earth Dragon",
  language: "en",
  source: {
    markdownDir: "source/markdown",
    imageDir: "source/images"
  }
};

const fileOrder = (name) => {
  if (/^Front_Matter|^front-matter/i.test(name)) return 0;
  const match = name.match(/Chapter_(\d+)|chapter-(\d+)/i);
  return match ? Number(match[1] || match[2]) : 999;
};

const titleFromFile = (name, markdownTitle) => {
  if (markdownTitle) return markdownTitle.replace(/^#\s*/, "").replace(/\s+-\s+P\d+$/i, "").trim();
  return name
    .replace(/_Updated\.md$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const splitSentences = (text) => {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  return normalized.match(/[^.!?]+[.!?"]*|[^.!?]+$/g)?.map((item) => item.trim()).filter(Boolean) ?? [normalized];
};

const tokenize = (sentence) => {
  const parts = sentence.match(/[A-Za-z]+(?:['-][A-Za-z]+)?|\d+|[^\sA-Za-z\d]+|\s+/g) ?? [];
  let index = 0;
  return parts.map((value) => {
    const isWord = /^[A-Za-z]+(?:['-][A-Za-z]+)?$/.test(value);
    return {
      type: isWord ? "word" : /\s+/.test(value) ? "space" : "punctuation",
      value,
      tokenId: isWord ? `w${index++}` : null
    };
  });
};

const stripRepeatedChapterHeading = (paragraph, title, isFirstParagraph) => {
  if (!isFirstParagraph || !/^Chapter\s+\d+/i.test(title)) return paragraph;
  const shortTitle = title.replace(/^Chapter\s+\d+\s*-\s*/i, "").trim();
  const words = shortTitle.match(/[A-Za-z']+/g) || [];
  const paragraphWords = paragraph.match(/[A-Za-z']+/g) || [];
  const titlePrefix =
    words.length &&
    words.every((word, index) => paragraphWords[index]?.toLowerCase() === word.toLowerCase());

  if (titlePrefix) {
    const pattern = new RegExp(`^\\s*${words.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[\\s\\W]+")}\\W*`, "i");
    const stripped = paragraph.replace(pattern, "").trim();
    const extraHeading = stripped.match(/^([A-Z][A-Z'!-]*(?:\s+[A-Z][A-Z'!-]*){0,5})(?=\s+[A-Z]?[a-z])/);
    return extraHeading ? stripped.slice(extraHeading[0].length).trim() : stripped;
  }

  const leadingAllCaps = paragraph.match(/^([A-Z][A-Z'!-]*(?:\s+[A-Z][A-Z'!-]*){0,5})(?=\s+[A-Z]?[a-z])/);
  return leadingAllCaps ? paragraph.slice(leadingAllCaps[0].length).trim() : paragraph;
};

const fixKnownOcrWords = (paragraph) =>
  paragraph.replace(/\bL?rake(?='s\b|\s+(?:doesn't|steps|dove|ducks|peers)\b)/g, "Drake");

const readBookMeta = async (bookDirName) => {
  const metaPath = path.join(booksRoot, bookDirName, "book.config.json");
  try {
    const meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
    return {
      ...defaultBookMeta,
      ...meta,
      source: {
        ...defaultBookMeta.source,
        ...(meta.source || {})
      }
    };
  } catch {
    if (bookDirName === defaultBookMeta.id) return defaultBookMeta;
    return {
      ...defaultBookMeta,
      id: bookDirName,
      title: bookDirName.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    };
  }
};

const parseMarkdown = (bookMeta, fileName, text, imageFiles) => {
  const lines = text.split(/\r?\n/);
  const markdownTitle = lines.find((line) => line.startsWith("# "));
  const title = titleFromFile(fileName, markdownTitle);
  const chapterId = slugify(title || fileName);
  const blocks = [];
  let page = null;
  let buffer = [];
  let blockIndex = 0;
  let paragraphIndex = 0;

  const flushParagraphs = () => {
    const joined = buffer.join("\n").trim();
    buffer = [];
    if (!joined) return;
    const paragraphs = joined
      .split(/\n{2,}/)
      .map((item) => item.replace(/\n/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .filter((item) => item !== "_No OCR text on this page._");

    for (const rawParagraph of paragraphs) {
      const paragraph = fixKnownOcrWords(stripRepeatedChapterHeading(rawParagraph, title, paragraphIndex === 0));
      paragraphIndex += 1;
      if (!paragraph) continue;
      const sentences = splitSentences(paragraph).map((sentence, sentenceIndex) => ({
        sentenceId: `${chapterId}-b${blockIndex}-s${sentenceIndex}`,
        text: sentence,
        tokens: tokenize(sentence)
      }));
      blocks.push({
        id: `${chapterId}-b${blockIndex++}`,
        type: "paragraph",
        page,
        text: paragraph,
        sentences
      });
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith("# ")) {
      if (!line) buffer.push("");
      continue;
    }

    const pageMatch = line.match(/^##\s+Page\s+(\d+)/i);
    if (pageMatch) {
      flushParagraphs();
      page = Number(pageMatch[1]);
      const imageFile = `${page}.png`;
      const hasImage = imageFiles.has(imageFile);
      blocks.push({
        id: `${chapterId}-image-${page}`,
        type: "image",
        page,
        src: hasImage ? `/book-assets/${bookMeta.id}/${imageFile}` : "",
        alt: `${title} page ${page}`,
        missing: !hasImage
      });
      blocks.push({
        id: `${chapterId}-page-${page}`,
        type: "pageBreak",
        page,
        label: `Page ${page}`
      });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraphs();
      blocks.push({
        id: `${chapterId}-subheading-${blockIndex++}`,
        type: "heading",
        page,
        text: line.replace(/^##\s+/, "")
      });
      continue;
    }

    buffer.push(line);
  }

  flushParagraphs();

  return {
    id: chapterId,
    title,
    sourceFile: `books/${bookMeta.id}/${bookMeta.source.markdownDir}/${fileName}`,
    blocks
  };
};

async function importBook(bookDirName) {
  const bookMeta = await readBookMeta(bookDirName);
  const bookDir = path.join(booksRoot, bookDirName);
  const markdownDir = path.join(bookDir, bookMeta.source.markdownDir);
  const imageDir = path.join(bookDir, bookMeta.source.imageDir);
  const bookOutputRoot = path.join(outputRoot, bookMeta.id);
  const chapterOutput = path.join(bookOutputRoot, "chapters");

  await fs.mkdir(chapterOutput, { recursive: true });

  const [files, imageFileList] = await Promise.all([fs.readdir(markdownDir), fs.readdir(imageDir)]);
  const imageFiles = new Set(imageFileList.filter((name) => /^\d+\.png$/i.test(name)));
  const markdownFiles = files
    .filter((name) => name.endsWith(".md"))
    .sort((a, b) => fileOrder(a) - fileOrder(b) || a.localeCompare(b));

  const chapters = [];
  for (const fileName of markdownFiles) {
    const text = await fs.readFile(path.join(markdownDir, fileName), "utf8");
    const chapter = parseMarkdown(bookMeta, fileName, text, imageFiles);
    const outputFile = `${chapter.id}.json`;
    chapters.push({
      id: chapter.id,
      title: chapter.title,
      href: `chapters/${outputFile}`,
      sourceFile: chapter.sourceFile,
      pageStart: chapter.blocks.find((block) => Number.isFinite(block.page))?.page ?? null,
      pageEnd: [...chapter.blocks].reverse().find((block) => Number.isFinite(block.page))?.page ?? null
    });
    await fs.writeFile(path.join(chapterOutput, outputFile), `${JSON.stringify(chapter, null, 2)}\n`);
  }

  const book = {
    id: bookMeta.id,
    title: bookMeta.title,
    subtitle: bookMeta.subtitle || "",
    cover: bookMeta.cover || `/book-assets/${bookMeta.id}/8.png`,
    language: bookMeta.language || "en",
    importVersion: 2,
    source: {
      contentRoot: `books/${bookDirName}`,
      markdownDir: `books/${bookDirName}/${bookMeta.source.markdownDir}`,
      imageDir: `books/${bookDirName}/${bookMeta.source.imageDir}`
    },
    characters: bookMeta.characters || [],
    chapters
  };

  await fs.writeFile(path.join(bookOutputRoot, "book.json"), `${JSON.stringify(book, null, 2)}\n`);
  return {
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    cover: book.cover,
    href: `${book.id}/book.json`,
    chapterCount: chapters.length
  };
}

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });
  const args = process.argv.slice(2);
  const requestedBooks = args.length ? args : (await fs.readdir(booksRoot)).filter((name) => !name.startsWith("."));
  const catalog = [];

  for (const bookDirName of requestedBooks) {
    const imported = await importBook(bookDirName);
    catalog.push(imported);
    console.log(`Imported ${imported.chapterCount} chapters for ${imported.id}`);
  }

  await fs.writeFile(
    path.join(outputRoot, "catalog.json"),
    `${JSON.stringify({ importVersion: 2, books: catalog }, null, 2)}\n`
  );
  console.log(`Wrote catalog for ${catalog.length} book(s)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
