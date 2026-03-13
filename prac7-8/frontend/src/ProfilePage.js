import { useEffect, useState } from "react";
import api, { AUTO_LOGOUT_TIME } from "./api";

function ProfilePage() {
    const [profileData, setProfileData] = useState(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const token = localStorage.getItem("accessToken") || "";

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("loginTime");
        window.location.href = "/login";
    };

    useEffect(() => {
        const updateTimer = () => {
            const loginTime = Number(localStorage.getItem("loginTime") || 0);

            if (!loginTime) {
                logout();
                return;
            }

            const elapsed = Date.now() - loginTime;
            const leftMs = AUTO_LOGOUT_TIME - elapsed;
            const leftSec = Math.max(0, Math.ceil(leftMs / 1000));

            setSecondsLeft(leftSec);

            if (leftMs <= 0) {
                logout();
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, []);

    const getProfile = async () => {
        try {
            const response = await api.get("/api/auth/me");
            setProfileData(response.data);
        } catch (error) {
            setProfileData({
                error: error.response?.data?.error || "Ошибка запроса",
            });
        }
    };

    return (
        <div className="page">
            <div className="panel">
                <div className="tokenBlock">
                    <strong>Токен:</strong> {token}
                </div>

                {/*<p>Выход через: {secondsLeft} сек.</p>*/}

                <div className="buttonRow">
                    <button onClick={getProfile}>Мой профиль</button>
                    <button onClick={logout}>Выйти</button>
                </div>

                <div className="resultBlock">
                    <pre>{JSON.stringify(profileData, null, 2)}</pre>
                </div>
            </div>
        </div>
    );
}

export default ProfilePage;