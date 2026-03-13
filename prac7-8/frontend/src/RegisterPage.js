import { useState } from "react";
import api from "./api";

function RegisterPage() {
    const [form, setForm] = useState({
        email: "",
        first_name: "",
        last_name: "",
        password: "",
    });

    const [message, setMessage] = useState("");

    const onChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        try {
            await api.post("/api/auth/register", form);
            setMessage("Регистрация успешна");
        } catch (error) {
            setMessage(error.response?.data?.error || "Ошибка регистрации");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Регистрация</h2>
            <form onSubmit={onSubmit}>
                <input name="email" placeholder="Email" onChange={onChange} /><br /><br />
                <input name="first_name" placeholder="Имя" onChange={onChange} /><br /><br />
                <input name="last_name" placeholder="Фамилия" onChange={onChange} /><br /><br />
                <input name="password" type="password" placeholder="Пароль" onChange={onChange} /><br /><br />
                <button type="submit">Зарегистрироваться</button>
            </form>
            <p>{message}</p>
        </div>
    );
}

export default RegisterPage;