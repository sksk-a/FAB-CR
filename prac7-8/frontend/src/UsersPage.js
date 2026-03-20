import React, { useState, useEffect } from "react";
import axios from "axios";

function UsersPage() {
    const [users, setUsers] = useState([]);
    const token = localStorage.getItem("accessToken");

    const fetchUsers = async () => {
        try {
            const res = await axios.get("http://localhost:3001/api/users", {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error("Ошибка при получении юзеров", err);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const changeRole = async (userId, newRole) => {
        try {
            await axios.patch("http://localhost:3001/api/admin/set-role",
                { userId, newRole },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchUsers(); 
            alert("Роль успешно изменена");
        } catch (err) {
            alert("Ошибка при смене роли");
        }
    };
    const deleteUser = async (userId) => {
        if (!window.confirm("Удалить пользователя?")) return;
        try {
            await axios.delete(`http://localhost:3001/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) {
            alert("Ошибка при удалении");
        }
    };

    return (
        <div className="page">
            <div className="panel">
                <h2>Управление пользователями (Админ)</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {users.map((u) => (
                        <div key={u.id} className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9f9f9" }}>
                            <div>
                                <strong>{u.email}</strong> <br />
                                <small>ID: {u.id} | Текущая роль: {u.role}</small>
                            </div>

                            <div style={{ display: "flex", gap: "10px" }}>
                                {/* ВЫБОР РОЛИ (Пункт 3.2) */}
                                <select
                                    value={u.role}
                                    onChange={(e) => changeRole(u.id, e.target.value)}
                                    style={{ padding: "5px", borderRadius: "4px" }}
                                >
                                    <option value="user">Пользователь</option>
                                    <option value="seller">Продавец</option>
                                    <option value="admin">Администратор</option>
                                </select>

                                <button
                                    onClick={() => deleteUser(u.id)}
                                    style={{ background: "#ff4d4f", color: "white", border: "none", padding: "5px 10px", borderRadius: "4px" }}
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {users.length === 0 && <p>Загрузка пользователей...</p>}
            </div>
        </div>
    );
}

export default UsersPage;