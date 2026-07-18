import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { loginAnalyst } from "../services/authService";
import { FaShieldAlt } from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("dineshkarthik1839@gmail.com");
  const [password, setPassword] = useState("A73897389@");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await loginAnalyst(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail ?? 
        "Authentication failed. Check your network or credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "radial-gradient(circle at 50% 50%, #153255 0%, #060a12 85%)",
        padding: 20,
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
      }}
    >
      <div
        className="panel"
        style={{
          width: "min(420px, 100%)",
          padding: "36px 32px",
          border: "1px solid #1e3d63",
          background: "rgba(10, 18, 30, 0.95)",
          boxShadow: "0 0 40px rgba(11, 25, 44, 0.9), inset 0 0 15px rgba(22, 123, 184, 0.1)",
          position: "relative",
          overflow: "hidden",
          animation: "fadeInUp 0.4s ease-out"
        }}
      >
        {/* Futuristic top glass reflection bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #fb8b32, #0ea5e9)" }} />
        
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#167bb822", display: "grid", placeItems: "center", color: "#36d8a5", border: "1px solid #167bb8" }}>
            <FaShieldAlt size={22} />
          </div>
        </div>

        <div className="eyebrow" style={{ color: "#fb8b32", fontSize: 10, letterSpacing: ".15em", textAlign: "center" }}>SECURE ACCESS GATEWAY</div>
        <h1 style={{ fontSize: 26, margin: "8px 0 4px", fontWeight: 800, color: "#eaf4ff", letterSpacing: "-.02em", textAlign: "center" }}>
          ICTIP Console
        </h1>
        <p className="muted" style={{ fontSize: 11, marginBottom: 28, color: "#6a7b95", textAlign: "center" }}>
          Sign in to access India's Cyber Threat Intelligence Platform.
        </p>

        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              background: "rgba(255, 99, 116, 0.08)",
              border: "1px solid #ff637488",
              color: "#ff6374",
              fontSize: 11,
              lineHeight: 1.5,
              marginBottom: 20
            }}
          >
            <strong>Access Denied:</strong> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: 11, color: "#9bacc0", fontWeight: 650, display: "block", marginBottom: 7 }}>
              ANALYST EMAIL
            </label>
            <input
              className="field"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dineshkarthik1839@gmail.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#9bacc0", fontWeight: 650, display: "block", marginBottom: 7 }}>
              CREDENTIAL PASSWORD
            </label>
            <input
              className="field"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={isLoading}
            style={{ width: "100%", marginTop: 8, height: 44, fontSize: 13, gap: 10 }}
          >
            {isLoading ? "AUTHORIZING TERMINAL..." : "SIGN IN SECURELY"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center", borderTop: "1px solid #16263b", paddingTop: 16 }}>
          <p className="muted" style={{ fontSize: 9, margin: 0, letterSpacing: ".05em" }}>
            RESTRICTED SYSTEM FOR AUTHORIZED ANALYSTS ONLY.
          </p>
          <p className="muted" style={{ fontSize: 9, margin: "4px 0 0", color: "#485b73" }}>
            ALL USER SESSIONS AND COMMANDS ARE AUDITED.
          </p>
        </div>
      </div>
    </div>
  );
}