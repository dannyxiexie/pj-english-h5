# Reader Template

This folder is the reusable H5 ebook reader template.

It loads books from `public/data/books/catalog.json`, then reads each book from
`public/data/books/<book-id>/book.json` and chapter JSON files. Reader state is
stored per book under browser localStorage, so progress, vocabulary, lookup
cache, and display settings do not mix between books.

Book source files live outside the template under `books/<book-id>/source`.
