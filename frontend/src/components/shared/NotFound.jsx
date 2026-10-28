
import { Link } from "react-router-dom";

export default function NotFound() {
    return (
        <div style={{
            minHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "24px"
        }}>
            <h1 style={{ fontSize: "80px", margin: 0 }}>404</h1>

            <h2>Page Not Found</h2>

            <p>
                Sorry, the page you're looking for doesn't exist.
            </p>

            <Link to="/">
                Go back home
            </Link>
        </div>
    );
}
