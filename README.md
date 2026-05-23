# PJ English H5

面向家庭共读的英语 H5/PWA 阅读器。项目分成两层：

- `src/reader/`：通用看书模板，不和某一本书绑定。
- `books/<book-id>/`：每本书的原始提取内容和配置。

打开应用后先进入书架，选择书以后进入阅读。每本书的阅读进度、生词本、查词缓存、显示设置都会按 `bookId` 独立保存。

## 使用

```bash
npm install
npm run import:books
npm start
```

Mac 上打开 `http://localhost:4173`。iPad/iPhone 和 Mac 在同一个局域网时，可以打开 `http://你的MacIP:4173`。

## 当前书籍

- `books/dragon-master/`：Dragon Masters: Rise of the Earth Dragon

说明：本次整理时原始插图文件夹需要重新补回到 `books/dragon-master/source/images/`。当前仓库保留了文字内容、导入流程和占位封面；图片补回后运行 `npm run import:books` 会自动插入对应页码图片。

## 新书导入

详见 [docs/IMPORT_BOOKS.md](docs/IMPORT_BOOKS.md)。

最推荐的新书结构：

```text
books/my-new-book/
  book.config.json
  source/
    markdown/
      Chapter_01.md
      Chapter_02.md
    images/
      1.png
      2.png
```

然后运行：

```bash
npm run import:books
```

## 查词模型

不配置模型也能使用，本地服务会返回快速兜底解释。需要联网上下文解释时，复制 `.env.example` 为 `.env`，填写：

```bash
LLM_API_KEY=你的Key
LLM_API_BASE=https://你的OpenAI兼容地址/v1
LLM_MODEL=你的模型名
```

API Key 只在本地服务端读取，不会写入网页前端。

## 已实现

- 书架选书
- 每本书独立进度、生词本、查词缓存和显示设置
- iPad/iPhone/投屏响应式阅读布局
- `手持`、`共读`、`投屏` 预设和高级显示配置
- 白色、深色、魔法三套配色方案
- 长按英文单词触发学习面板，短点不会查词，未查词时不常驻解释栏
- 右侧学习面板，小屏自动变成底部抽屉
- 上下文查词接口和本地兜底解释
- 常用用法优先来自本文短语、人工高频短语库、免 Key 词典例句和受限语料搭配；没有可靠结果时不硬凑
- 单词发音播放、美式音标显示，失败时回退到浏览器语音
- 生词本收录、再次收录、含义/发音勾选和次数统计
- 生词本归档、已归档筛选、恢复到在学和归档后删除
- JSON 导出/导入备份

## Legacy

远端仓库原来的 `Amy的可爱英语帮手` 已保留在 `legacy/amy-english-helper/`，没有直接覆盖删除。
