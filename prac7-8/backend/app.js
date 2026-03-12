const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = 3000;

app.use(express.json());

const JWT_SECRET = "super_secret_key";
const ACCESS_EXPIRES_IN = "15m";

let users = [];
let products = [];

// --------------------
// Swagger
// --------------------
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API",
      version: "1.0.0",
      description: "Практики 7-8"
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
            email: {
              type: "string",
              example: "timurs@gmail.com"
            },
            first_name: {
              type: "string",
              example: "Тимур"
            },
            last_name: {
              type: "string",
              example: "Сеидов"
            },
            password: {
              type: "string",
              example: "qwerty123"
            }
          }
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              example: "timurs@gmail.com"
            },
            password: {
              type: "string",
              example: "qwerty123"
            }
          }
        },
        ProductRequest: {
          type: "object",
          required: ["title", "category", "description", "price"],
          properties: {
            title: {
              type: "string",
              example: "Ноутбук Lenovo"
            },
            category: {
              type: "string",
              example: "Электроника"
            },
            description: {
              type: "string",
              example: "Игровой ноутбук"
            },
            price: {
              type: "number",
              example: 79999
            }
          }
        },
        UserResponse: {
          type: "object",
          properties: {
            id: { type: "string", example: "abc123" },
            email: { type: "string", example: "ivan@mail.com" },
            first_name: { type: "string", example: "Иван" },
            last_name: { type: "string", example: "Иванов" }
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
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
      return res.status(400).json({
        error: "email, first_name, last_name, password are required"
      });
    }

    const existingUser = users.find((u) => u.email === email);

    if (existingUser) {
      return res.status(409).json({
        error: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: nanoid(8),
      email,
      first_name,
      last_name,
      hashedPassword
    };

    users.push(newUser);

    return res.status(201).json({
      message: "User registered",
      user: {
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name
      }
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({
      error: "Server error during register",
      details: error.message
    });
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
 *         description: Успешный вход
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

    const isValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isValid) {
      return res.status(401).json({
        error: "Неверный пароль"
      });
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email
      },
      JWT_SECRET,
      {
        expiresIn: "15m"
      }
    );

    return res.status(200).json({
      message: "Вход успешен",
      accessToken
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
    last_name: user.last_name
  });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductRequest'
 *     responses:
 *       201:
 *         description: Товар создан
 *       400:
 *         description: Не заполнены обязательные поля
 */
app.post("/api/products", (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({
      error: "title, category, description, price are required"
    });
  }

  const newProduct = {
    id: nanoid(8),
    title,
    category,
    description,
    price: Number(price)
  };

  products.push(newProduct);

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
app.get("/api/products", (req, res) => {
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар найден
 *       401:
 *         description: Нет токена или токен невалиден
 *       404:
 *         description: Товар не найден
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
 *     summary: Обновить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductRequest'
 *     responses:
 *       200:
 *         description: Товар обновлен
 *       401:
 *         description: Нет токена или токен невалиден
 *       404:
 *         description: Товар не найден
 */
app.put("/api/products/:id", authMiddleware, (req, res) => {
  const product = findProductById(req.params.id);

  if (!product) {
    return res.status(404).json({
      error: "Product not found"
    });
  }

  const { title, category, description, price } = req.body;

  if (!title || !category || !description || price === undefined) {
    return res.status(400).json({
      error: "title, category, description, price are required"
    });
  }

  product.title = title;
  product.category = category;
  product.description = description;
  product.price = Number(price);

  return res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар удален
 *       401:
 *         description: Нет токена или токен невалиден
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/products/:id", authMiddleware, (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
});