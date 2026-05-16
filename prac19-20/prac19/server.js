const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('API пользователей на PostgreSQL работает');
});

app.post('/api/users', async (req, res) => {
    try {
        const { first_name, last_name, age } = req.body;

        if (!first_name || !last_name || !age) {
            return res.status(400).json({
                message: 'Поля first_name, last_name и age обязательны',
            });
        }

        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, age)
       VALUES ($1, $2, $3)
       RETURNING *`,
            [first_name, last_name, age]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при создании пользователя',
            error: error.message,
        });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM users ORDER BY id ASC'
        );

        res.json(result.rows);
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при получении пользователей',
            error: error.message,
        });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Пользователь не найден',
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при получении пользователя',
            error: error.message,
        });
    }
});

app.patch('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, age } = req.body;

        const oldUser = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [id]
        );

        if (oldUser.rows.length === 0) {
            return res.status(404).json({
                message: 'Пользователь не найден',
            });
        }

        const currentUser = oldUser.rows[0];

        const result = await pool.query(
            `UPDATE users
       SET first_name = $1,
           last_name = $2,
           age = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
            [
                first_name || currentUser.first_name,
                last_name || currentUser.last_name,
                age || currentUser.age,
                id,
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при обновлении пользователя',
            error: error.message,
        });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: 'Пользователь не найден',
            });
        }

        res.json({
            message: 'Пользователь успешно удален',
            deletedUser: result.rows[0],
        });
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при удалении пользователя',
            error: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});