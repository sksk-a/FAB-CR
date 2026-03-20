import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await axios.post("http://localhost:3001/api/auth/register", {
                email: email,
                first_name: firstName,
                password: password
            });
            navigate("/login");
        } catch (err) {
            setError(err.response?.data?.error || "Ошибка регистрации");
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "40px auto", padding: "20px" }}>
            <h2>Регистрация</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ padding: "10px", fontSize: "16px" }}
                />

                <input
                    type="text"
                    placeholder="Имя"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    style={{ padding: "10px", fontSize: "16px" }}
                />

                <input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ padding: "10px", fontSize: "16px" }}
                />

                {/* Выпадающий список ролей мы отсюда безжалостно вырезали */}

                <button
                    type="submit"
                    style={{
                        padding: "10px",
                        fontSize: "16px",
                        background: "#333",
                        color: "white",
                        border: "none",
                        cursor: "pointer"
                    }}
                >
                    Создать аккаунт
                </button>
            </form>
        </div>
    );
}

export default RegisterPage;