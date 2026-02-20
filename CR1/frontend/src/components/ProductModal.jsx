import React, { useEffect, useMemo, useState } from "react";

const CATEGORIES = [
    "Клавиатуры",
    "Мыши",
    "Коврики",
    "Гарнитуры",
    "Микрофоны",
    "Геймпады",
    "Стриминг",
    "Аксессуары",
];

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [stock, setStock] = useState("");

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
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return alert("Цена должна быть числом >= 0");
        if (!Number.isFinite(parsedStock) || parsedStock < 0) return alert("Остаток должен быть числом >= 0");

        onSubmit({
            id: initialProduct?.id,
            name: trimmedName,
            category: trimmedCategory,
            description: trimmedDesc,
            price: parsedPrice,
            stock: parsedStock,
        });
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