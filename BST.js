class TreeNode {
    constructor(book) {
        this.book = book;
        this.left = null;
        this.right = null;
    }
}

function insert(root, book) {
    if (!root) return new TreeNode(book);

    if (book.title.toLowerCase() < root.book.title.toLowerCase()) {
        root.left = insert(root.left, book);
    } else {
        root.right = insert(root.right, book);
    }

    return root;
}

function search(root, title) {
    if (!root) return null;
    if (root.book.title.toLowerCase() === title.toLowerCase()) return root.book;

    return title.toLowerCase() < root.book.title.toLowerCase()
        ? search(root.left, title)
        : search(root.right, title);
}

// Remove function to delete a book from the BST
function remove(root, title) {
    if (!root) return null;

    if (title.toLowerCase() < root.book.title.toLowerCase()) {
        root.left = remove(root.left, title);
    } else if (title.toLowerCase() > root.book.title.toLowerCase()) {
        root.right = remove(root.right, title);
    } else {
        if (!root.left) {
            return root.right;
        } else if (!root.right) {
            return root.left;
        }

        root.book = findMin(root.right).book;
        root.right = remove(root.right, root.book.title);
    }

    return root;
}

function findMin(node) {
    while (node.left) {
        node = node.left;
    }
    return node;
}

export { insert, search, remove };
