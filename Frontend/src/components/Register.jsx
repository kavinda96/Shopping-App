import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { postJSON } from '../api';

export default function Register() {
  const nav = useNavigate();
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [err, setErr]         = useState(null);
  const [ok, setOk]           = useState(false);

  async function onSubmit(e) {
    e.preventDefault(); setErr(null);
    try {
      await postJSON('/register', { name, email, password });
      setOk(true);
      setTimeout(()=> nav('/login'), 800);
    } catch (e) {
      setErr('Email already registered or invalid data');
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Register</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name"
               className="w-full border rounded px-3 py-2" required />
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email"
               className="w-full border rounded px-3 py-2" required />
        <input value={password} onChange={e=>setPass(e.target.value)} type="password" placeholder="Password"
               className="w-full border rounded px-3 py-2" required />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {ok && <div className="text-green-700 text-sm">Registered! Redirecting…</div>}
        <button className="w-full border rounded px-3 py-2 bg-black text-white">Create account</button>
      </form>
      <div className="text-sm mt-3">Have an account? <Link to="/login" className="underline">Login</Link></div>
    </div>
  );
}
