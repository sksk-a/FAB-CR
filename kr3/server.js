const express = require('express');
const https = require('https');
const { Server } = require('socket.io'); // Измененный импорт
const path = require('path');
const fs = require('fs');

const app = express();

// Читаем сертификаты
const options = {
    key: fs.readFileSync(path.join(__dirname, 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'localhost+2.pem'))
};

// Создаем сервер
const server = https.createServer(options, app);

// Инициализируем сокеты
const io = new Server(server); 

// Явно разрешаем отдавать файлы из текущей папки
app.use(express.static(path.resolve(__dirname)));

io.on('connection', (socket) => {
    console.log('✅ Socket connected!');
    
    socket.on('newReminder', (data) => {
        const delay = data.reminderTime - Date.now();
        if (delay > 0) {
            setTimeout(() => {
                io.emit('pushNotification', {
                    title: '⏰ Пора!',
                    body: data.text,
                    reminderId: data.id
                });
            }, delay);
        }
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('🚀 HTTPS Server ready at https://localhost:3000');
});