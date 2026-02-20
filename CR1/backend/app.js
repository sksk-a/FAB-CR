const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");

const app = express();
const port = 3000;

app.use(express.json());

app.use(
    cors({
        origin: "http://localhost:3001",
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use((req, res, next) => {
    res.on("finish", () => {
        console.log(
            `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`
        );
        if (["POST", "PUT", "PATCH"].includes(req.method)) {
            console.log("Body:", req.body);
        }
    });
    next();
});

let products = [
    {
        id: nanoid(6),
        name: "Wooting 80HE",
        category: "Клавиатуры",
        description: "Магнитные свитчи, быстрый отклик, идеальна для FPS и MOBA.",
        price: 24990,
        stock: 7,
    },
    {
        id: nanoid(6),
        name: "Logitech G Pro X Superlight",
        category: "Мыши",
        description: "Ультралёгкая беспроводная мышь для киберспорта.",
        price: 10990,
        stock: 12,
    },
    {
        id: nanoid(6),
        name: "SteelSeries QcK Heavy",
        category: "Коврики",
        description: "Толстый коврик с контролем и ровным скольжением.",
        price: 2490,
        stock: 18,
    },
    {
        id: nanoid(6),
        name: "HyperX Cloud II",
        category: "Гарнитуры",
        description: "Комфортная гарнитура с хорошим микрофоном и звуком.",
        price: 7490,
        stock: 9,
    },
    {
        id: nanoid(6),
        name: "Razer Huntsman Mini",
        category: "Клавиатуры",
        description: "Компактная 60% клавиатура, быстрые оптические свитчи.",
        price: 8990,
        stock: 6,
    },
    {
        id: nanoid(6),
        name: "Glorious Model O",
        category: "Мыши",
        description: "Лёгкая мышь с сотами, подходит для агрессивного аима.",
        price: 4990,
        stock: 15,
    },
    {
        id: nanoid(6),
        name: "Elgato Stream Deck Mini",
        category: "Стриминг",
        description: "Панель кнопок для макросов, стрима и быстрого управления.",
        price: 9990,
        stock: 5,
    },
    {
        id: nanoid(6),
        name: "Xbox Wireless Controller",
        category: "Геймпады",
        description: "Универсальный геймпад для ПК и консоли.",
        price: 6490,
        stock: 10,
    },
    {
        id: nanoid(6),
        name: "AverMedia Live Gamer Mini",
        category: "Стриминг",
        description: "Карта захвата для записи и стримов в Full HD.",
        price: 8990,
        stock: 4,
    },
    {
        id: nanoid(6),
        name: "NZXT Capsule",
        category: "Микрофоны",
        description: "USB-микрофон с чистым звуком.",
        price: 6990,
        stock: 8,
    },
];

function findProductOr404(id, res) {
    const product = products.find((p) => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Продукт не найден!" });
        return null;
    }
    return product;
}

function validateProductPayload(payload, { partial = false } = {}) {
    const errors = [];

    const has = (k) => Object.prototype.hasOwnProperty.call(payload, k);

    if (!partial || has("name")) {
        const v = payload.name;
        if (typeof v !== "string" || !v.trim()) errors.push("имя не должно быть пустым");
    }

    if (!partial || has("category")) {
        const v = payload.category;
        if (typeof v !== "string" || !v.trim()) errors.push("категория не должна быть пустой");
    }

    if (!partial || has("description")) {
        const v = payload.description;
        if (typeof v !== "string" || v.trim().length < 5) errors.push("описание должно быть строкой (от 5 символов)");
    }

    if (!partial || has("price")) {
        const v = Number(payload.price);
        if (!Number.isFinite(v) || v < 0) errors.push("цена должна быть >= 0");
    }

    if (!partial || has("stock")) {
        const v = Number(payload.stock);
        if (!Number.isFinite(v) || v < 0) errors.push("кол-во должно быть >= 0");
    }

    return errors;
}

app.get("/api/products", (req, res) => {
    res.json(products);
});

app.get("/api/products/:id", (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    res.json(product);
});

app.post("/api/products", (req, res) => {
    const errors = validateProductPayload(req.body, { partial: false });
    if (errors.length) return res.status(400).json({ error: "Ошибка валидации!", details: errors });

    const { name, category, description, price, stock } = req.body;

    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.patch("/api/products/:id", (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;

    if (
        req.body?.name === undefined &&
        req.body?.category === undefined &&
        req.body?.description === undefined &&
        req.body?.price === undefined &&
        req.body?.stock === undefined
    ) {
        return res.status(400).json({ error: "Nothing to update" });
    }

    const errors = validateProductPayload(req.body, { partial: true });
    if (errors.length) return res.status(400).json({ error: "Ошибка валидации!", details: errors });

    const { name, category, description, price, stock } = req.body;

    if (name !== undefined) product.name = String(name).trim();
    if (category !== undefined) product.category = String(category).trim();
    if (description !== undefined) product.description = String(description).trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);

    res.json(product);
});

app.delete("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const exists = products.some((p) => p.id === id);
    if (!exists) return res.status(404).json({ error: "Product not found" });

    products = products.filter((p) => p.id !== id);
    res.status(204).send();
});

app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
    console.log(`Backend: http://localhost:${port}`);
    console.log(`API: http://localhost:${port}/api/products`);
});