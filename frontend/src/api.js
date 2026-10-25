import axios from "axios";

const postAPI = axios.create({
    baseURL: "http://localhost:5000/posts",
    withCredentials: true
})

const userAPI = axios.create({
    baseURL: "http://localhost:5000/users",
    withCredentials: true
});

const connectionAPI = axios.create({
    baseURL : "http://localhost:5000/connections",
    withCredentials: true
})

export { postAPI,userAPI, connectionAPI};