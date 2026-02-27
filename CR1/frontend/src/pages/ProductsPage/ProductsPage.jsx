import React, { useEffect, useState } from "react";
import "./ProductsPage.scss";
import ProductsList from "../../components/ProductsList";
import ProductModal from "../../components/ProductModal";
import { api } from "../../api";

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // create | edit
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            alert("Ошибка загрузки товаров.");
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setModalMode("create");
        setEditingProduct(null);
        setModalOpen(true);
    };

    const openEdit = (product) => {
        setModalMode("edit");
        setEditingProduct(product);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
    };

    const handleDelete = async (id) => {
        const ok = window.confirm("Удалить товар?");
        if (!ok) return;

        try {
            await api.deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error(err);
            alert("Ошибка удаления товара");
        }
    };

    const handleSubmitModal = async (payload) => {
        try {
            if (modalMode === "create") {
                const created = await api.createProduct(payload);
                setProducts((prev) => [...prev, created]);
            } else {
                const patchPayload = { ...payload };
                delete patchPayload.imageFile;

                if (patchPayload.imageUrl) {
                    patchPayload.image = patchPayload.imageUrl;
                    delete patchPayload.imageUrl;
                }

                const updated = await api.updateProduct(payload.id, patchPayload);
                setProducts((prev) => prev.map((p) => (p.id === payload.id ? updated : p)));
            }

            closeModal();
        } catch (err) {
            console.error(err);
            const msg =
                err?.response?.data?.details?.join("\n") ||
                err?.response?.data?.error ||
                "Ошибка сохранения товара";
            alert(msg);
        }
    };

    return (
        <div className="page">
            <header className="header">
                <div className="header__inner">
                    <div className="brand">DNS 2.0</div>
                    <div className="header__right">Лучшие игровые девайсы!</div>
                </div>
            </header>

            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h1 className="title">Товары</h1>
                        <div className="toolbar__actions">
                            <button className="btn" onClick={loadProducts} disabled={loading}>
                                Обновить
                            </button>
                            <button className="btn btn--primary" onClick={openCreate}>
                                + Добавить
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty">Загрузка...</div>
                    ) : (
                        <ProductsList products={products} onEdit={openEdit} onDelete={handleDelete} />
                    )}
                </div>
            </main>

            <footer className="footer">
                <div className="footer__inner">© {new Date().getFullYear()} DNS 2.0 - лучший магазин игровой перифирии!</div>
            </footer>

            <ProductModal
                open={modalOpen}
                mode={modalMode}
                initialProduct={editingProduct}
                onClose={closeModal}
                onSubmit={handleSubmitModal}
            />
        </div>
    );
}