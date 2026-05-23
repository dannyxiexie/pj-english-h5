# 导入新书

你以后只需要先把书处理成“文字 + 图片”两个文件夹，再放进本项目。

## 1. 新建书籍目录

用英文小写短横线作为书籍 ID：

```text
books/my-book-id/
  book.config.json
  source/
    markdown/
    images/
```

## 2. 放入 Markdown 文本

把章节 Markdown 放到：

```text
books/my-book-id/source/markdown/
```

推荐格式：

```markdown
# Chapter 1 - The Beginning

## Page 1

Text on page 1.

## Page 2

Text on page 2.
```

导入器会识别 `## Page 23` 这种页码，并用它匹配图片。

## 3. 放入图片

把图片放到：

```text
books/my-book-id/source/images/
```

图片文件名按原 PDF 页码命名：

```text
1.png
2.png
23.png
24.png
```

如果某一页没有图片，可以不放。导入器仍会保留这一页的图片位置，阅读器里会显示缺图提示；补回图片并重新导入后会自动换成真实图片。

## 4. 配置书籍信息

新建 `books/my-book-id/book.config.json`：

```json
{
  "id": "my-book-id",
  "title": "My Book Title",
  "subtitle": "Optional subtitle",
  "language": "en",
  "cover": "/book-assets/my-book-id/1.png",
  "source": {
    "markdownDir": "source/markdown",
    "imageDir": "source/images"
  },
  "characters": [
    { "id": "alice", "name": "Alice", "color": "#1f6f68" },
    { "id": "king-roland", "name": "King Roland", "aliases": ["Roland"], "color": "#9d7a18" }
  ]
}
```

`cover` 可以指向这本书图片文件夹里的某一张图，也可以指向 `public/` 下的占位封面。

`characters` 是可选的人物表。`name` 和 `aliases` 会用于阅读页人物名标色；颜色可以在应用的设置页继续调整。

## 5. 运行导入

导入全部书：

```bash
npm run import:books
```

只导入一本书：

```bash
npm run import:book -- my-book-id
```

导入后会生成：

```text
public/data/books/catalog.json
public/data/books/my-book-id/book.json
public/data/books/my-book-id/chapters/*.json
```

## 6. 检查

```bash
npm start
```

打开 `http://localhost:4173`，书应该出现在书架里。
