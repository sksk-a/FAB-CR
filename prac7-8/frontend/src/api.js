import axios from "axios";
export const AUTO_LOGOUT_TIME = 100000 * 1000;

const api = axios.create({
    baseURL: "http://localhost:3001",
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem("refreshToken");

            if (refreshToken) {
                try {
                    const { data } = await axios.post("http://localhost:3001/api/auth/refresh", { refreshToken });
                    localStorage.setItem("accessToken", data.accessToken);
                    localStorage.setItem("refreshToken", data.refreshToken);
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    return api(originalRequest);
                } catch (refreshErr) {
                    localStorage.clear();
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;