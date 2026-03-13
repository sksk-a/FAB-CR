import { useEffect, useState } from "react";
import api from "./api";

function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState({
        title: "",
        category: "",
        description: "",
        price: "",
    });
    const [selectedId, setSelectedId] = useState("");
    const [singleProduct, setSingleProduct] = useState(null);
    const [message, setMessage] = useState("");

    const loadProducts = async () => {
        try {
            const response = await api.get("/api/products");
            setProducts(response.data);
        } catch {
            setMessage("Ошибка загрузки товаров");
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const createProduct = async (e) => {
        e.preventDefault();

        try {
            await api.post("/api/products", {
                ...form,
                price: Number(form.price),
            });

            setMessage("Товар создан");
            setForm({
                title: "",
                category: "",
                description: "",
                price: "",
            });
            loadProducts();
        } catch (error) {
            setMessage(error.response?.data?.error || "Ошибка создания");
        }
    };

    const getById = async () => {
        try {
            const response = await api.get(`/api/products/${selectedId}`);
            setSingleProduct(response.data);
            setMessage("Товар получен");
        } catch (error) {
            setMessage(error.response?.data?.error || "Ошибка получения товара");
        }
    };

    const updateProduct = async () => {
        try {
            await api.put(`/api/products/${selectedId}`, {
                ...form,
                price: Number(form.price),
            });
            setMessage("Товар обновлен");
            loadProducts();
        } catch (error) {
            setMessage(error.response?.data?.error || "Ошибка обновления");
        }
    };

    const deleteProduct = async () => {
        try {
            await api.delete(`/api/products/${selectedId}`);
            setMessage("Товар удален");
            setSingleProduct(null);
            loadProducts();
        } catch (error) {
            setMessage(error.response?.data?.error || "Ошибка удаления");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Товары</h2>

            <form onSubmit={createProduct}>
                <input name="title" placeholder="Название" value={form.title} onChange={onChange} /><br /><br />
                <input name="category" placeholder="Категория" value={form.category} onChange={onChange} /><br /><br />
                <input name="description" placeholder="Описание" value={form.description} onChange={onChange} /><br /><br />
                <input name="price" placeholder="Цена" value={form.price} onChange={onChange} /><br /><br />
                <button type="submit">Создать товар</button>
            </form>

            <hr />

            <input
                placeholder="ID товара"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
            />
            <button onClick={getById}>Получить по ID</button>
            <button onClick={updateProduct}>Изменить</button>
            <button onClick={deleteProduct}>Удалить</button>

            <p>{message}</p>

            {singleProduct && (
                <div>
                    <h3>Товар по ID</h3>
                    <pre>{JSON.stringify(singleProduct, null, 2)}</pre>
                </div>
            )}

            <h3>Все товары</h3>
            <pre>{JSON.stringify(products, null, 2)}</pre>
        </div>
    );
}

export default ProductsPage;