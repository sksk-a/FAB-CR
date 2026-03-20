import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import LoginPage from "./LoginPage";
import ProductsPage from "./ProductsPage";
import ProfilePage from "./ProfilePage";
import UsersPage from "./UsersPage";
import ProtectedRoute from "./ProtectedRoute";

function App() {
    const token = localStorage.getItem("accessToken");
    let role = "";
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            role = payload.role;
        } catch (e) {
            console.error("Token error", e);
        }
    }

    return (
        <BrowserRouter>
            <nav style={{
                padding: "15px",
                display: "flex",
                gap: "20px",
                background: "#f4f4f4",
                borderBottom: "1px solid #ccc",
                marginBottom: "20px"
            }}>
                <Link to="/products">Товары</Link>
                <Link to="/profile">Профиль</Link>

                {/* Ссылка на админку видна только админу */}
                {role === "admin" && (
                    <Link to="/users" style={{ fontWeight: "bold", color: "red" }}>
                        Управление пользователями (Админ)
                    </Link>
                )}

                <div style={{ marginLeft: "auto" }}>
                    <Link to="/login" style={{ marginRight: "10px" }}>Логин</Link>
                    <Link to="/register">Регистрация</Link>
                </div>
            </nav>

            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                <Routes>
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    <Route
                        path="/products"
                        element={
                            <ProtectedRoute>
                                <ProductsPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <ProfilePage />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/users"
                        element={
                            <ProtectedRoute>
                                <UsersPage />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="*" element={<LoginPage />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;