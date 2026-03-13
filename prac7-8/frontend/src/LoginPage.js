import { useState } from "react";
import api from "./api";

function LoginPage() {
    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [message, setMessage] = useState("");

    const onChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post("/api/auth/login", form);

            localStorage.setItem("accessToken", response.data.accessToken);

            if (response.data.refreshToken) {
                localStorage.setItem("refreshToken", response.data.refreshToken);
            }

            localStorage.setItem("loginTime", Date.now().toString());

            setMessage("Вход выполнен");
            window.location.href = "/profile";
        } catch (error) {
            setMessage(error.response?.data?.error || "Ошибка входа");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Вход</h2>

            <form onSubmit={onSubmit}>
                <input
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={onChange}
                />
                <br />
                <br />

                <input
                    name="password"
                    type="password"
                    placeholder="Пароль"
                    value={form.password}
                    onChange={onChange}
                />
                <br />
                <br />

                <button type="submit">Войти</button>
            </form>

            <p>{message}</p>
        </div>
    );
}

export default LoginPage;