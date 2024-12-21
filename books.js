import express from "express";
import requestQueue from "./requestQueue.js";
import { insert, search, remove } from "./BST.js";

const router = express.Router();

let books = [];
let borrowedBooks = [];
let root = null;

function sortBooks(criteria) {
    return books.sort((a, b) => {
        if (criteria === 'popularity') {
            return b.popularity - a.popularity;
        } else if (criteria === 'availability') {
            return b.bookCountAvailable - a.bookCountAvailable;
        }
        return 0;
    });
}

router.get("/", (req, res) => {
    const help = `
    REQUESTS:

    GET /allbooks?sortBy=popularity/availability       # Displays all books sorted by popularity or availability (optional)

    POST /addbook                          # Adds a new book to the system
    { title, author, bookCountAvailable, publisher, bookStatus, popularity }

    POST /requestbook                     # Adds a request to borrow a book
    { studentId, bookId }

    POST /returnbook                      # Processes the return of a book
    { bookId }

    DELETE /removebook/:id                # Admin-only: Removes a book by ID

    GET /getbook/:id                      # Retrieves details of a specific book by ID

    GET /search?title=BookTitle               # Searches for a book by its title using the Binary Search Tree

    `;
    try {
        res.status(200).send(help);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.post("/addbook", (req, res) => {
    try {
        const { title, author, bookCountAvailable, publisher, bookStatus, popularity } = req.body;

        const id = books.length;
        const newBook = {
            id,
            title,
            author,
            bookCountAvailable,
            publisher,
            bookStatus,
            popularity,
        };
        root = insert(root, newBook);
        books.push(newBook);

        res.status(201).json(newBook);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err });
    }
});


router.get("/allbooks", (req, res) => {
    try {
        const { sortBy } = req.query;
        let sortedBooks = books;

        if (sortBy) {
            sortedBooks = sortBooks(sortBy);
        } else {
            sortedBooks.sort((a,b) => {
                return a.id - b.id;
            })
        }

        res.status(200).json(sortedBooks);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/getbook/:id", (req, res) => {
    try {
        const bookId = parseInt(req.params.id);
        const book = books.find((b) => b.id === bookId);

        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.status(200).json(book);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
});


router.post("/requestbook", (req, res) => {
    try {
        const { studentId, bookId } = req.body;

        const book = books.find((b) => b.id === bookId);
        if (!book) {
            return res.status(404).json("Book not found");
        }
        if (book.bookCountAvailable > 0) {
            book.bookCountAvailable -= 1;
            borrowedBooks.push({
                studentId,
                book
            });
            return res.status(200).json({
                message: "Book issued successfully!",
                book,
            });
        }

        requestQueue.enqueue({ studentId, bookId });
        res.status(202).json({
            message: "Book is currently unavailable. Your request has been added to the queue.",
            position: requestQueue.size(),
        });
    } catch (err) {
        console.log(err);
        res.status(500).json(err);
    }
});

router.post("/returnbook", (req, res) => {
    try {
        const { bookId } = req.body;
        const bookBorrowed = borrowedBooks.find((b) => b.book.id === bookId);
        if (!bookBorrowed) {
            return res.status(404).json("Book not found");
        }
        bookBorrowed.book.bookCountAvailable += 1;
        borrowedBooks = borrowedBooks.filter((b) => b.book.id !== bookId || b !== bookBorrowed);
        console.log(borrowedBooks)
        if (!requestQueue.isEmpty()) {
            const nextRequest = requestQueue.peek();
            if (nextRequest.bookId === bookId) {
                requestQueue.dequeue();
                bookBorrowed.bookCountAvailable -= 1;
                return res.status(200).json({
                    message: `Book has been issued to the next student in the queue (Student ID: ${nextRequest.studentId}).`,
                    bookBorrowed,
                });
            }
        }

        res.status(200).json({
            message: "Book returned successfully!",
            bookBorrowed,
        });
    } catch (err) {
        console.log(err)
        res.status(500).json(err);
    }
});

router.get("/search", (req, res) => {
    try {
        const { title } = req.query;

        if (!title) {
            return res.status(400).json({ message: "Book title is required" });
        }
        const book = search(root, title);

        if (!book) {
            return res.status(404).json({ message: "Book not found" });
        }
        res.status(200).json(book);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err });
    }
});

router.delete("/removebook/:id", (req, res) => {
    try {
        const bookId = req.params.id;
        const bookIndex = books.findIndex((book) => book.id === parseInt(bookId));
        if (bookIndex === -1) {
            return res.status(404).json("Book not found");
        }
        const book = books[bookIndex];
        if (book.bookCountAvailable < book.bookCount) {
            return res.status(400).json("Book is currently borrowed and cannot be deleted");
        }
        root = remove(root, book.title);
        books.splice(bookIndex, 1);

        res.status(200).json("Book has been deleted successfully");
    } catch (err) {
        res.status(500).json(err);
    }
});


export default router;