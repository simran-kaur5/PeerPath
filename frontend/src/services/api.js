import axios from "axios";

const BASE_URL =
    "https://peerpath-26mg.onrender.com" || "http://localhost:5000";

const postAPI = axios.create({
    baseURL: `${BASE_URL}/posts`,
    withCredentials: true
})

const userAPI = axios.create({
    baseURL: `${BASE_URL}/users`,
    withCredentials: true
});

const connectionAPI = axios.create({
    baseURL : `${BASE_URL}/connections`,
    withCredentials: true
})

const notificationAPI = axios.create({
    baseURL: `${BASE_URL}/notifications`,
    withCredentials: true
})

// console.log("API URL:", BASE_URL);

export { postAPI,userAPI, connectionAPI,notificationAPI};