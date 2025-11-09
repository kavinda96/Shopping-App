import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { postJSON } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const data = await postJSON("/login", { email, password });
      login(data); // saves token+user
      nav("/"); // go home
    } catch (e) {
      console.log(e);
      setErr("Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          className="w-full border rounded px-3 py-2"
          required
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button
          disabled={loading}
          className="w-full border rounded px-3 py-2 bg-black text-white"
        >
          {loading ? "Signing in…" : "Login"}
        </button>
      </form>
      <div className="text-sm mt-3">
        No account?{" "}
        <Link to="/register" className="underline">
          Register
        </Link>
      </div>
    </div>
  );
}
