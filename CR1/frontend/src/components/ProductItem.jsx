import React from "react";

function formatPrice(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

export default function ProductItem({ product, onEdit, onDelete }) {
    return (
        <div className="productRow">
            <div className="productMain">
                <div className="productTop">
                    <div className="productId">#{product.id}</div>
                    <div className="productName">{product.name}</div>
                    <div className="badge">{product.category}</div>
                </div>

                <div className="productDesc">{product.description}</div>

                <div className="productMeta">
                    <div>Цена: <b>{formatPrice(product.price)}</b></div>
                    <div>Остаток: <b>{product.stock}</b></div>
                </div>
            </div>

            <div className="productActions">
                <button className="btn" onClick={() => onEdit(product)}>
                    Редактировать
                </button>
                <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
                    Удалить
                </button>
            </div>
        </div>
    );
}