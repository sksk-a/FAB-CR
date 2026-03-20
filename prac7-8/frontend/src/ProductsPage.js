import React, { useState, useEffect } from "react";
import axios from "axios";

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [user, setUser] = useState(null); 
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        description: "",
        price: "",
        imageUrl: ""
    });

    const token = localStorage.getItem("accessToken");

    const fetchData = async () => {
        try {

            const userRes = await axios.get("http://localhost:3001/api/auth/me", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUser(userRes.data);

            const prodRes = await axios.get("http://localhost:3001/api/products", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProducts(prodRes.data);
        } catch (err) {
            console.error("Ошибка загрузки данных:", err);
        }
    };

    useEffect(() => {
        if (token) fetchData();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {

                await axios.put(`http://localhost:3001/api/products/${editingId}`, formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEditingId(null);
            } else {

                await axios.post("http://localhost:3001/api/products", formData, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setFormData({ title: "", category: "", price: "", imageUrl: "" });
            fetchData();
        } catch (err) {
            alert("Ошибка доступа или сервера");
        }
    };


    const handleDelete = async (id) => {
        if (!window.confirm("Подтвердите удаление товара.")) return;
        try {
            await axios.delete(`http://localhost:3001/api/products/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            alert("Только админ может удалять!");
        }
    };


    const startEdit = (p) => {
        setEditingId(p.id);
        setFormData({
            title: p.title,
            category: p.category,
            price: p.price,
            imageUrl: p.imageUrl
        });
        window.scrollTo(0, 0); 
    };

    const canManage = user?.role === "admin" || user?.role === "seller";
    const canDelete = user?.role === "admin";

    return (
        <div className="page">

            {canManage && (
                <div className="panel" style={{ marginBottom: "30px" }}>
                    <h3>{editingId ? "Редактировать" : "Добавить товар"}</h3>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <input
                            type="text" placeholder="Название" required
                            value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                        <input
                            type="text" placeholder="Категория"
                            value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}
                        />
                        <textarea
                            placeholder="Описание товара"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px' }}
                        />
                        <input
                            type="number" placeholder="Цена" required
                            value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })}
                        />
                        <input
                            type="text" placeholder="URL картинки"
                            value={formData.imageUrl} onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                        />
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button type="submit" style={{ flex: 2 }}>
                                {editingId ? "Сохранить" : "Создать"}
                            </button>
                            {editingId && (
                                <button type="button" onClick={() => { setEditingId(null); setFormData({ title: "", category: "", price: "", imageUrl: "" }) }} style={{ flex: 1, background: "#ccc", border: "none" }}>
                                    Отмена
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="products-grid" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "20px"
            }}>
                {products.map(p => (
                    <div key={p.id} className="panel product-card" style={{ display: "flex", flexDirection: "column" }}>
                        <img
                            src={p.imageUrl || "https://via.placeholder.com/500"}
                            alt={p.title}
                            style={{
                                width: "100%",
                                aspectRatio: "1/1",
                                objectFit: "cover",
                                borderRadius: "6px",
                                marginBottom: "10px"
                            }}
                        />
                        <div style={{ flexGrow: 1 }}>
                            <h4 style={{ margin: "0 0 5px 0" }}>{p.title}</h4>
                            <p style={{ fontSize: "14px", color: "#666", margin: "0" }}>{p.category}</p>
                            <p style={{ margin: '10px 0', fontSize: '14px' }}>{p.description}</p>
                            <p style={{ fontSize: "18px", fontWeight: "bold" }}>Цена: {p.price} ₽</p>
                        </div>

                        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                            {canManage && (
                                <button onClick={() => startEdit(p)} style={{ flex: 1, background: "#f0ad4e", border: "none", fontSize: "12px" }}>
                                    Редакт.
                                </button>
                            )}
                            {canDelete && (
                                <button onClick={() => handleDelete(p.id)} style={{ flex: 1, background: "#d9534f", border: "none", fontSize: "12px" }}>
                                    Удалить
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {products.length === 0 && <p>Товаров пока нет...</p>}
        </div>
    );
};

export default ProductsPage;