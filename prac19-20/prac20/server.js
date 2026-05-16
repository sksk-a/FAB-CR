const express = require('express');
const cors = require('cors');
const Datastore = require('nedb-promises');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

const usersDb = Datastore.create({
    filename: 'users.db',
    autoload: true,
});

async function getNextUserId() {
    const users = await usersDb.find({});
    if (users.length === 0) return 1;

    const maxId = Math.max(...users.map(user => user.id));
    return maxId + 1;
}

app.get('/', (req, res) => {
    res.send('API пользователей на NoSQL базе данных работает.');
});

// CREATE
app.post('/api/users', async (req, res) => {
    try {
        const { first_name, last_name, age } = req.body;

        if (!first_name || !last_name || !age) {
            return res.status(400).json({
                message: 'Поля first_name, last_name и age обязательны',
            });
        }

        const now = Math.floor(Date.now() / 1000);

        const user = {
            id: await getNextUserId(),
            first_name,
            last_name,
            age: Number(age),
            created_at: now,
            updated_at: now,
        };

        const createdUser = await usersDb.insert(user);

        res.status(201).json(createdUser);
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при создании пользователя',
            error: error.message,
        });
    }
});

// READ ALL
app.get('/api/users', async (req, res) => {
    try {
        const users = await usersDb.find({}).sort({ id: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при получении пользователей',
            error: error.message,
        });
    }
});

// READ ONE
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await usersDb.findOne({
            id: Number(req.params.id),
        });

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден',
            });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при получении пользователя',
            error: error.message,
        });
    }
});

// UPDATE
app.patch('/api/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { first_name, last_name, age } = req.body;

        const user = await usersDb.findOne({ id });

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден',
            });
        }

        const updatedData = {
            updated_at: Math.floor(Date.now() / 1000),
        };

        if (first_name) updatedData.first_name = first_name;
        if (last_name) updatedData.last_name = last_name;
        if (age) updatedData.age = Number(age);

        await usersDb.update(
            { id },
            { $set: updatedData }
        );

        const updatedUser = await usersDb.findOne({ id });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({
            message: 'Ошибка при обновлении пользователя',
            error: error.message,
        });
    }
});

// DELETE
app.delete('/api/users/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        const user = await usersDb.findOne({ id });

        if (!user) {
            return res.status(404).json({
                message: 'Пользователь не найден',
            });
        }

        await usersDb.remove({ id });

        res.json({
            message: 'Пользователь успешно удален',
            deletedUser: user,
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