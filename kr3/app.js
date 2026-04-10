const contentDiv = document.getElementById('app-content');
const homeBtn = document.getElementById('home-btn');
const aboutBtn = document.getElementById('about-btn');
const statusText = document.getElementById('status');

const socket = typeof io !== 'undefined' ? io() : null;

async function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission !== "granted") {
        await Notification.requestPermission();
    }
}

function initNotes() {
    const form = document.getElementById("note-form");
    const input = document.getElementById("note-input");
    const reminderForm = document.getElementById("reminder-form");
    const reminderText = document.getElementById("reminder-text");
    const reminderTime = document.getElementById("reminder-time");
    const list = document.getElementById("notes-list");
    const clearBtn = document.getElementById("clear-btn");

    function renderNotes() {
        const notes = JSON.parse(localStorage.getItem("notes") || "[]");
        if (!list) return;
        list.innerHTML = notes.map((note) => {
            let reminderInfo = '';
            if (note.reminder) {
                const date = new Date(note.reminder);
                reminderInfo = `<br><small style="color: #d9534f;">🔔 Напоминание: ${date.toLocaleString()}</small>`;
            }
            return `
                <li class="card" style="margin-bottom: 0.5rem; padding: 0.8rem;">
                    <span>${note.text}${reminderInfo}</span>
                    <button class="button error outline delete-btn" data-id="${note.id}" 
                        style="float:right; padding: 2px 10px; background-color: #ff0000; border-color: #ff0000; color: #ffffff;">×</button>
                </li>`;
        }).join("");
    }

    function addNote(text, reminderTimestamp = null) {
        const notes = JSON.parse(localStorage.getItem("notes") || "[]");
        const newNote = { id: Date.now(), text, reminder: reminderTimestamp };
        notes.push(newNote);
        localStorage.setItem("notes", JSON.stringify(notes));
        renderNotes();

        if (reminderTimestamp) {
            if (socket) {
                socket.emit('newReminder', {
                    id: newNote.id,
                    text: text,
                    reminderTime: reminderTimestamp
                });
            }
        } else {
            if (Notification.permission === "granted") {
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification("Заметка добавлена", {
                        body: text,
                        icon: "/icons/favicon-32x32.png",
                        badge: "/icons/favicon-32x32.png",
                        vibrate: [100, 50, 100]
                    });
                });
            }
        }
    }

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            if (input.value.trim()) {
                addNote(input.value.trim());
                input.value = "";
            }
        });
    }

    if (reminderForm) {
        reminderForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const text = reminderText.value.trim();
            const datetime = reminderTime.value;
            if (text && datetime) {
                const timestamp = new Date(datetime).getTime();
                if (timestamp > Date.now()) {
                    addNote(text, timestamp);
                    reminderText.value = "";
                    reminderTime.value = "";
                } else {
                    alert('Выберите время в будущем!');
                }
            }
        });
    }

    if (list) {
        list.addEventListener("click", (e) => {
            if (e.target.classList.contains("delete-btn")) {
                const id = Number(e.target.dataset.id);
                let notes = JSON.parse(localStorage.getItem("notes") || "[]");
                notes = notes.filter(n => n.id !== id);
                localStorage.setItem("notes", JSON.stringify(notes));
                renderNotes();
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            localStorage.removeItem("notes");
            renderNotes();
        });
    }

    renderNotes();
}

async function loadContent(page) {
    try {
        [homeBtn, aboutBtn].forEach(btn => btn.classList.remove('active'));
        const response = await fetch(`/content/${page}.html?v=${Date.now()}`);
        if (!response.ok) throw new Error('Ошибка сети');
        const html = await response.text();
        contentDiv.innerHTML = html;

        if (page === 'home') {
            homeBtn.classList.add('active');
            initNotes();
        } else {
            aboutBtn.classList.add('active');
        }
    } catch (err) {
        contentDiv.innerHTML = `<p class="is-center text-error">Ошибка: ${err.message}</p>`;
    }
}

homeBtn.addEventListener('click', () => loadContent('home'));
aboutBtn.addEventListener('click', () => loadContent('about'));

loadContent('home');

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js")
            .then(reg => {
                statusText.textContent = "SW активен";
                requestNotificationPermission();
            })
            .catch(err => statusText.textContent = "Ошибка SW");
    });
}

function updateOnlineStatus() {
    const isOnline = navigator.onLine;
    statusText.textContent = isOnline ? "Статус: Онлайн" : "Статус: Оффлайн";
    statusText.style.color = isOnline ? "#4caf50" : "#f44336";
}

if (socket) {
    socket.on('pushNotification', (data) => {
        console.log('Получено уведомление от сервера:', data);
        
        if (Notification.permission === "granted") {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(data.title, {
                    body: data.body,
                    icon: "/icons/favicon-32x32.png",
                    data: { reminderId: data.reminderId },
                    actions: [
                        { action: 'snooze', title: '⏰ Отложить на 5 мин' }
                    ]
                });
            });
        }
    });
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();