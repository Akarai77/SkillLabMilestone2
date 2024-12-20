import express from 'express';
import bookRoutes from "./books.js";

const app = express();

app.use(express.json());

app.use("/api/books", bookRoutes);

app.get("/", (req, res) => {
  res.status(200).send("Welcome to LibraryApp");
});

app.listen(3000, () => {
  console.log(`Server is running in PORT 3000`);
});