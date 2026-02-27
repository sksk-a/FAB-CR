const path = require("path");
const multer = require("multer");
const express = require("express");
const cors = require("cors");
const { nanoid } = require("nanoid");

const app = express();
const port = 3000;

app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
    cors({
        origin: "http://localhost:3001",
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// лог запросов
app.use((req, res, next) => {
    res.on("finish", () => {
        console.log(
            `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`
        );
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
        image: "",
    },
    {
        id: nanoid(6),
        name: "Logitech G Pro X Superlight",
        category: "Мыши",
        description: "Ультралёгкая беспроводная мышь для киберспорта.",
        price: 10990,
        stock: 12,
        image: "",
    },
    {
        id: nanoid(6),
        name: "SteelSeries QcK Heavy",
        category: "Коврики",
        description: "Толстый коврик с контролем и ровным скольжением.",
        price: 2490,
        stock: 18,
        image: "",
    },
    {
        id: nanoid(6),
        name: "HyperX Cloud II",
        category: "Гарнитуры",
        description: "Комфортная гарнитура с хорошим микрофоном и звуком.",
        price: 7490,
        stock: 9,
        image: "",
    },
    {
        id: nanoid(6),
        name: "Razer Huntsman Mini",
        category: "Клавиатуры",
        description: "Компактная 60% клавиатура, быстрые оптические свитчи.",
        price: 8990,
        stock: 6,
        image: "",
    },
    {
        id: nanoid(6),
        name: "Glorious Model O",
        category: "Мыши",
        description: "Лёгкая мышь с сотами, подходит для агрессивного аима.",
        price: 4990,
        stock: 15,
        image: "",
    },
    {
        id: nanoid(6),
        name: "Elgato Stream Deck Mini",
        category: "Стриминг",
        description: "Панель кнопок для макросов, стрима и быстрого управления.",
        price: 9990,
        stock: 5,
        image: "",
    },
    {
        id: nanoid(6),
        name: "Xbox Wireless Controller",
        category: "Геймпады",
        description: "Универсальный геймпад для ПК и консоли.",
        price: 6490,
        stock: 10,
        image: "",
    },
    {
        id: nanoid(6),
        name: "AverMedia Live Gamer Mini",
        category: "Стриминг",
        description: "Карта захвата для записи и стримов в Full HD.",
        price: 8990,
        stock: 4,
        image: "",
    },
    {
        id: nanoid(6),
        name: "NZXT Capsule",
        category: "Микрофоны",
        description: "USB-микрофон с чистым звуком.",
        price: 6990,
        stock: 8,
        image: "",
    },
];

function findProductOr404(id, res) {
    const product = products.find((p) => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Продукт не найден" });
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
        if (typeof v !== "string" || v.trim().length < 5)
            errors.push("описание должно быть от 5 символов");
    }

    if (!partial || has("price")) {
        const v = Number(payload.price);
        if (!Number.isFinite(v) || v < 0) errors.push("цена должна быть >= 0");
    }

    if (!partial || has("stock")) {
        const v = Number(payload.stock);
        if (!Number.isFinite(v) || v < 0) errors.push("наличие должно быть >= 0");
    }

    if (!partial || has("image")) {
        const v = payload.image;
        if (v !== undefined && typeof v !== "string") errors.push("image должно быть строкой");
        if (typeof v === "string" && v.trim()) {
            const s = v.trim();
            const ok = s.startsWith("/uploads/") || /^https?:\/\//i.test(s);
            if (!ok) errors.push('image должно начинаться с "/uploads/" или "http(s)://"');
        }
    }

    return errors;
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, "uploads")),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        cb(null, `${Date.now()}-${nanoid(6)}${ext || ""}`);
    },
});

const fileFilter = (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
        return cb(new Error("Only image files are allowed"), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

app.get("/api/products", (req, res) => {
    res.json(products);
});

app.get("/api/products/:id", (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    res.json(product);
});

app.post("/api/products", upload.single("imageFile"), (req, res) => {
    const body = req.body || {};

    const payload = {
        name: (body.name ?? "").trim(),
        category: (body.category ?? "").trim(),
        description: (body.description ?? "").trim(),
        price: Number(body.price),
        stock: Number(body.stock),
    };

    const imageUrl = (body.imageUrl ?? "").trim();
    const uploadedPath = req.file ? `/uploads/${req.file.filename}` : "";
    const image = uploadedPath || imageUrl || "";

    const errors = validateProductPayload(payload, { partial: false });

    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
        errors.push("URL картинки должен начинаться с http(s)://");
    }

    if (errors.length) return res.status(400).json({ error: "Ошибка валидации", details: errors });

    const newProduct = {
        id: nanoid(6),
        ...payload,
        image,
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.patch("/api/products/:id", (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;

    const body = req.body || {};

    if (
        body.name === undefined &&
        body.category === undefined &&
        body.description === undefined &&
        body.price === undefined &&
        body.stock === undefined &&
        body.image === undefined
    ) {
        return res.status(400).json({ error: "Nothing to update" });
    }

    const errors = validateProductPayload(body, { partial: true });
    if (errors.length) return res.status(400).json({ error: "Ошибка валидации", details: errors });

    if (body.name !== undefined) product.name = String(body.name).trim();
    if (body.category !== undefined) product.category = String(body.category).trim();
    if (body.description !== undefined) product.description = String(body.description).trim();
    if (body.price !== undefined) product.price = Number(body.price);
    if (body.stock !== undefined) product.stock = Number(body.stock);
    if (body.image !== undefined) product.image = String(body.image).trim();

    res.json(product);
});

app.delete("/api/products/:id", (req, res) => {
    const id = req.params.id;
    const exists = products.some((p) => p.id === id);
    if (!exists) return res.status(404).json({ error: "Продукт не найден" });

    products = products.filter((p) => p.id !== id);
    res.status(204).send();
});

app.use((req, res) => {
    res.status(404).json({ error: "404 =(" });
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
    console.log(`Backend: http://localhost:${port}`);
    console.log(`API: http://localhost:${port}/api/products`);
});