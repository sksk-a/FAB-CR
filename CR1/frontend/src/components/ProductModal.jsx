import React, { useEffect, useMemo, useState } from "react";

const CATEGORIES = [
    "Клавиатуры",
    "Мыши",
    "Коврики",
    "Гарнитуры",
    "Микрофоны",
    "Геймпады",
    "Стрим",
    "Аксессуары",
];

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");

    // Картинка: none | url | file
    const [imageMode, setImageMode] = useState("none");
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState(null);

    const title = useMemo(
        () => (mode === "edit" ? "Редактирование товара" : "Добавление товара"),
        [mode]
    );

    useEffect(() => {
        if (!open) return;

        setName(initialProduct?.name ?? "");
        setCategory(initialProduct?.category ?? CATEGORIES[0]);
        setDescription(initialProduct?.description ?? "");
        setPrice(initialProduct?.price != null ? String(initialProduct.price) : "");
        setStock(initialProduct?.stock != null ? String(initialProduct.stock) : "");

        // На открытии сбрасываем выбор картинки (так безопаснее)
        setImageMode("none");
        setImageUrl("");
        setImageFile(null);
    }, [open, initialProduct]);

    if (!open) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedName = name.trim();
        const trimmedCategory = String(category || "").trim();
        const trimmedDesc = description.trim();

        const parsedPrice = Number(price);
        const parsedStock = Number(stock);

        if (!trimmedName) return alert("Введите название");
        if (!trimmedCategory) return alert("Введите категорию");
        if (trimmedDesc.length < 5) return alert("Описание минимум 5 символов");
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0)
            return alert("Цена должна быть числом >= 0");
        if (!Number.isFinite(parsedStock) || parsedStock < 0)
            return alert("Остаток должен быть числом >= 0");

        if (imageMode === "url" && imageUrl.trim() && !/^https?:\/\//i.test(imageUrl.trim())) {
            return alert("URL должен начинаться с http:// или https://");
        }
        if (imageMode === "file" && !imageFile) {
            return alert("Выбери файл картинки");
        }

        const payload = {
            id: initialProduct?.id,
            name: trimmedName,
            category: trimmedCategory,
            description: trimmedDesc,
            price: parsedPrice,
            stock: parsedStock,
        };

        // Добавляем картинку только если пользователь выбрал
        if (imageMode === "url" && imageUrl.trim()) {
            payload.imageUrl = imageUrl.trim();
        }
        if (imageMode === "file" && imageFile) {
            payload.imageFile = imageFile; // File object
        }

        onSubmit(payload);
    };

    return (
        <div className="backdrop" onMouseDown={onClose}>
            <div
                className="modal"
                onMouseDown={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <div className="modal__header">
                    <div className="modal__title">{title}</div>
                    <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
                        ✕
                    </button>
                </div>

                <form className="form" onSubmit={handleSubmit}>
                    <label className="label">
                        Название
                        <input
                            className="input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Например, Wooting 80HE"
                            autoFocus
                        />
                    </label>

                    <label className="label">
                        Категория
                        <select
                            className="input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            {CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                            <option value="Другое">Другое</option>
                        </select>
                    </label>

                    <label className="label">
                        Описание
                        <textarea
                            className="textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Коротко опиши товар..."
                        />
                    </label>

                    <label className="label">
                        Цена
                        <input
                            className="input"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            inputMode="numeric"
                            placeholder="Например, 4990"
                        />
                    </label>

                    <label className="label">
                        Количество на складе
                        <input
                            className="input"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            inputMode="numeric"
                            placeholder="Например, 10"
                        />
                    </label>

                    <label className="label">
                        Картинка
                        <select
                            className="input"
                            value={imageMode}
                            onChange={(e) => {
                                setImageMode(e.target.value);
                                setImageUrl("");
                                setImageFile(null);
                            }}
                        >
                            <option value="none">Не менять / без</option>
                            <option value="url">Указать URL</option>
                            <option value="file">Загрузить файл</option>
                        </select>
                    </label>

                    {imageMode === "url" && (
                        <label className="label">
                            URL картинки
                            <input
                                className="input"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                            />
                        </label>
                    )}

                    {imageMode === "file" && (
                        <label className="label">
                            Файл картинки
                            <input
                                className="input"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                            />
                        </label>
                    )}

                    <div className="modal__footer">
                        <button type="button" className="btn" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn btn--primary">
                            {mode === "edit" ? "Сохранить" : "Добавить"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}