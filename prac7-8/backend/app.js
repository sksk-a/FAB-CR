const cors = require("cors");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const JWT_SECRET = "super_secret_key";
const REFRESH_SECRET = "refresh_super_secret_key"; // 11 практика
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d"; // 11 практика
const adminHash = "$2b$10$vI8BHY.D1WnOJZIn/tV4Ae.m9v0v4xQ3S/r6m8h8v9v9v9v9v9v9v"; // admin123 (bcrypt hash)

let users = [];
let products = [];
let refreshTokens = new Set();

// Автоматически создаем супер-админа при старте сервера
(async () => {
    try {
        const adminPassword = await hashPassword("admin123");
        users.push({
            id: "1",
            email: "admin@test.com",
            first_name: "Тимур",
            last_name: "Босс",
            hashedPassword: adminPassword,
            role: "admin"
        });
        console.log("✅ Супер-админ загружен: admin@test.com / admin123");
    } catch (error) {
        console.error("Ошибка при создании админа:", error);
    }
})();
// --------------------
// Swagger
// --------------------
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "API",
            version: "1.0.0",
            description: "Практики 7-11 (с поддержкой RBAC и Refresh Tokens)"
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: "Local server"
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },
            schemas: {
                RegisterRequest: {
                    type: "object",
                    required: ["email", "first_name", "last_name", "password"],
                    properties: {
                        email: { type: "string", example: "timurs@gmail.com" },
                        first_name: { type: "string", example: "Тимур" },
                        last_name: { type: "string", example: "Сеидов" },
                        password: { type: "string", example: "qwerty123" },
                        role: { type: "string", enum: ["user", "seller", "admin"], example: "user" }
                    }
                },
                LoginRequest: {
                    type: "object",
                    required: ["email", "password"],
                    properties: {
                        email: { type: "string", example: "timurs@gmail.com" },
                        password: { type: "string", example: "qwerty123" }
                    }
                },
                ProductRequest: {
                    type: "object",
                    required: ["title", "category", "description", "price"],
                    properties: {
                        title: { type: "string", example: "Ноутбук Lenovo" },
                        category: { type: "string", example: "Электроника" },
                        description: { type: "string", example: "Игровой ноутбук" },
                        price: { type: "number", example: 79999 }
                    }
                },
                UserResponse: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "abc123" },
                        email: { type: "string", example: "ivan@mail.com" },
                        first_name: { type: "string", example: "Иван" },
                        last_name: { type: "string", example: "Иванов" },
                        role: { type: "string", example: "user" }
                    }
                },
                ProductResponse: {
                    type: "object",
                    properties: {
                        id: { type: "string", example: "p1" },
                        title: { type: "string", example: "Ноутбук Lenovo" },
                        category: { type: "string", example: "Электроника" },
                        description: { type: "string", example: "Игровой ноутбук" },
                        price: { type: "number", example: 79999 }
                    }
                }
            }
        }
    },
    apis: ["./app.js"]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --------------------
// Helpers
// --------------------
async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            error: "Missing or invalid Authorization header"
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({
            error: "Invalid or expired token"
        });
    }
}

// Middleware для проверки ролей (Практика 11)
function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Forbidden: Access denied for your role"
            });
        }
        next();
    };
}

function findUserByEmail(email) {
    return users.find((u) => u.email === email);
}

function findProductById(id) {
    return products.find((p) => p.id === id);
}

// --------------------
// Logger
// --------------------
app.use((req, res, next) => {
    res.on("finish", () => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} -> ${res.statusCode}`);
        if (["POST", "PUT", "PATCH"].includes(req.method)) {
            console.log("Body:", req.body);
        }
    });
    next();
});

// --------------------
// Auth Routes
// --------------------

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Пользователь создан
 *       400:
 *         description: Не заполнены обязательные поля
 *       409:
 *         description: Пользователь уже существует
 */
app.post("/api/auth/register", async (req, res) => {
    try {
        const { email, first_name, password } = req.body;
        if (!email || !first_name || !password) {
            return res.status(400).json({ error: "Email, name and password are required" });
        }

        if (findUserByEmail(email)) return res.status(409).json({ error: "User exists" });

        const newUser = {
            id: nanoid(8),
            email,
            first_name,
            hashedPassword: await hashPassword(password),
            role: "user" // ХАРДКОД: при регистрации роль всегда "user"
        };

        users.push(newUser);
        res.status(201).json({ message: "Registered as user", userId: newUser.id });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Успешный вход (Access + Refresh)
 *       400:
 *         description: Не заполнены обязательные поля
 *       401:
 *         description: Неверные учетные данные
 */
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email и пароль обязательны!"
            });
        }

        const user = users.find((u) => u.email === email);

        if (!user) {
            return res.status(401).json({
                error: "Пользователь не найден"
            });
        }

        const isValid = await verifyPassword(password, user.hashedPassword);

        if (!isValid) {
            return res.status(401).json({
                error: "Неверный пароль"
            });
        }

        const accessToken = jwt.sign(
            { sub: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: ACCESS_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            { sub: user.id },
            REFRESH_SECRET,
            { expiresIn: REFRESH_EXPIRES_IN }
        );

        refreshTokens.add(refreshToken);

        return res.status(200).json({
            message: "Вход успешен",
            accessToken,
            refreshToken
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({
            error: "Ошибка сервера во время входа",
            details: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить токены
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 */
app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken || !refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find(u => u.id === payload.sub);
        if (!user) return res.status(401).json({ error: "User not found" });

        refreshTokens.delete(refreshToken);

        const newAccessToken = jwt.sign(
            { sub: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: ACCESS_EXPIRES_IN }
        );
        const newRefreshToken = jwt.sign(
            { sub: user.id },
            REFRESH_SECRET,
            { expiresIn: REFRESH_EXPIRES_IN }
        );

        refreshTokens.add(newRefreshToken);

        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (e) {
        res.status(401).json({ error: "Token verification failed" });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего пользователя
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Данные текущего пользователя
 *       401:
 *         description: Нет токена или токен невалиден
 *       404:
 *         description: Пользователь не найден
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = users.find((u) => u.id === userId);

    if (!user) {
        return res.status(404).json({
            error: "User not found"
        });
    }

    return res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
    });
});

// --------------------
// Admin Routes (Практика 11)
// --------------------

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Список всех пользователей (Только для Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/users", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    return res.json(users.map(u => ({
        id: u.id,
        email: u.email,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role
    })));
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Удалить пользователя (Только Admin)
 *     tags: [Admin]
 */
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const { id } = req.params;

    // Не даем админу удалить самого себя (чтобы не заблокировать систему)
    if (id === req.user.sub || id === "admin-1") {
        return res.status(400).json({ error: "Нельзя удалить основного админа" });
    }

    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return res.status(404).json({ error: "Пользователь не найден" });

    users.splice(userIndex, 1);
    console.log(`[ADMIN] Пользователь ${id} удален`);
    res.json({ message: "Пользователь успешно удален" });
});

// --------------------
// Product Routes
// --------------------

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар (Seller/Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
    // Выводим в консоль сервака, что именно прилетело с фронта
    console.log("CREATE PRODUCT BODY:", req.body);

    const { title, category, description, price } = req.body;

    // Смягчаем проверку: главное, чтобы было название, остальное забьем заглушками
    if (!title) {
        return res.status(400).json({
            error: "Название товара (title) обязательно!"
        });
    }

    const newProduct = {
        id: nanoid(8),
        title: title,
        category: category || "Без категории",
        description: description || "Описание отсутствует",
        price: price !== undefined ? Number(price) : 0
    };

    products.push(newProduct);

    console.log("PRODUCT CREATED:", newProduct);
    return res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 */
app.get("/api/products", authMiddleware, (req, res) => {
    return res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по id
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/products/:id", authMiddleware, (req, res) => {
    const product = findProductById(req.params.id);

    if (!product) {
        return res.status(404).json({
            error: "Product not found"
        });
    }

    return res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар (Seller/Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) return res.status(404).json({ error: "Товар не найден" });

    const { title, category, description, price, imageUrl } = req.body;
    
    if (title) product.title = title;
    if (category) product.category = category;
    product.description = description || product.description; // Если пусто, оставляем старое
    if (price !== undefined) product.price = Number(price);
    if (imageUrl) product.imageUrl = imageUrl;

    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар (Admin Only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const product = findProductById(req.params.id);

    if (!product) {
        return res.status(404).json({
            error: "Product not found"
        });
    }

    products = products.filter((p) => p.id !== req.params.id);

    return res.json({
        message: "Product deleted"
    });
});

/**
 * @swagger
 * /api/admin/set-role:
 * patch:
 * summary: Изменить роль пользователя (Только для Admin)
 * tags: [Admin]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * userId: { type: string, example: "abc123" }
 * newRole: { type: string, enum: [user, seller, admin], example: "seller" }
 */
app.patch("/api/admin/set-role", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const { userId, newRole } = req.body;

    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });    

    user.role = newRole;
    console.log(`[ADMIN] Role changed for ${user.email} to ${newRole}`);

    res.json({ message: `Role for ${user.email} updated to ${newRole}`, user: { id: user.id, role: user.role } });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});