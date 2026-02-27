import React from "react";

function formatPrice(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return String(value);
    return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

function getImageSrc(image) {
    if (!image) return "";
    if (image.startsWith("/uploads/")) return `http://localhost:3000${image}`;
    return image;
}

export default function ProductItem({ product, onEdit, onDelete }) {
    const imgSrc = getImageSrc(product.image);

    return (
        <div className="productRow">
            {imgSrc ? (
                <img className="productImage" src={imgSrc} alt={product.name} />
            ) : (
                <div className="productImage productImage--placeholder">No image</div>
            )}

            <div className="productMain">
                <div className="productTop">
                    <div className="productId">#{product.id}</div>
                    <div className="productName">{product.name}</div>
                    <div className="badge">{product.category}</div>
                </div>

                <div className="productDesc">{product.description}</div>

                <div className="productMeta">
                    <div>
                        Цена: <b>{formatPrice(product.price)}</b>
                    </div>
                    <div>
                        Остаток: <b>{product.stock}</b>
                    </div>
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