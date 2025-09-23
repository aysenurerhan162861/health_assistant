import { useState } from 'react';
import API from '../services/api';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Şifre state
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/login', { email, password });
      localStorage.setItem('token', res.data.token); // Token’ı sakla
      setMessage('Giriş başarılı! Dashboard’a yönlendiriliyorsunuz...');
      setTimeout(() => router.push('/'), 1500);
    } catch (err) {
      console.log(err);
      setMessage('Email veya şifre yanlış.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Giriş Yap</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-3 w-80">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Şifre"          // Şifre kutusu
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded">
          Giriş Yap
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
