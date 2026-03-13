import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import LoginPage from "./LoginPage";
import ProductsPage from "./ProductsPage";
import ProfilePage from "./ProfilePage";
import ProtectedRoute from "./ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <nav style={{ padding: "10px", display: "flex", gap: "10px" }}>
                <Link to="/register">Регистрация</Link>
                <Link to="/login">Логин</Link>
                <Link to="/products">Товары</Link>
                <Link to="/profile">Профиль</Link>
            </nav>

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

                <Route path="*" element={<LoginPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;