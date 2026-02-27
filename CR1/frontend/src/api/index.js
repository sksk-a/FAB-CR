import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:3000/api",
    headers: { accept: "application/json" },
});

export const api = {
    getProducts: async () => (await apiClient.get("/products")).data,

    createProduct: async (payload) => {
        const hasFile = payload.imageFile instanceof File;

        if (hasFile || payload.imageUrl) {
            const fd = new FormData();
            fd.append("name", payload.name);
            fd.append("category", payload.category);
            fd.append("description", payload.description);
            fd.append("price", String(payload.price));
            fd.append("stock", String(payload.stock));
            if (payload.imageUrl) fd.append("imageUrl", payload.imageUrl);
            if (hasFile) fd.append("imageFile", payload.imageFile);

            return (await apiClient.post("/products", fd)).data;
        }

        return (
            await apiClient.post("/products", {
                name: payload.name,
                category: payload.category,
                description: payload.description,
                price: payload.price,
                stock: payload.stock,
            })
        ).data;
    },

    updateProduct: async (id, payload) => {
        return (await apiClient.patch(`/products/${id}`, payload)).data;
    },

    deleteProduct: async (id) => (await apiClient.delete(`/products/${id}`)).data,
};