const form = document.getElementById("note-form");
const input = document.getElementById("note-input");
const list = document.getElementById("notes-list");
const clearBtn = document.getElementById("clear-btn");
const statusText = document.getElementById("status");

function getNotes() {
    return JSON.parse(localStorage.getItem("notes") || "[]");
}

function saveNotes(notes) {
    localStorage.setItem("notes", JSON.stringify(notes));
}

function renderNotes() {
    const notes = getNotes();

    if (notes.length === 0) {
        list.innerHTML = "<li>Список пока пуст</li>";
        return;
    }

    list.innerHTML = notes
        .map(
            (note, index) => `
        <li>
          <span class="note-text">${note}</span>
          <button class="delete-btn" data-index="${index}">Удалить</button>
        </li>
      `
        )
        .join("");
}

function addNote(text) {
    const notes = getNotes();
    notes.push(text);
    saveNotes(notes);
    renderNotes();
}

function deleteNote(index) {
    const notes = getNotes();
    notes.splice(index, 1);
    saveNotes(notes);
    renderNotes();
}

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    addNote(text);
    input.value = "";
    input.focus();
});

list.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete-btn")) {
        const index = Number(e.target.dataset.index);
        deleteNote(index);
    }
});

clearBtn.addEventListener("click", () => {
    localStorage.removeItem("notes");
    renderNotes();
});

renderNotes();

if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
        try {
            const registration = await navigator.serviceWorker.register("/sw.js");
            statusText.textContent = `Service Worker зарегистрирован: ${registration.scope}`;
            console.log("Service Worker зарегистрирован:", registration.scope);
        } catch (error) {
            statusText.textContent = "Ошибка регистрации Service Worker";
            console.error("Ошибка регистрации Service Worker:", error);
        }
    });
} else {
    statusText.textContent = "Service Worker не поддерживается";
}