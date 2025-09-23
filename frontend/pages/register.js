import { useState } from 'react';
import API from '../services/api';
import { useRouter } from 'next/router';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Şifre state'i
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Backend FastAPI Form alanları ile uyumlu
      await API.post('/users', { name, email, password });
      setMessage('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      console.log(err);
      setMessage('Kayıt sırasında bir hata oluştu.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Kayıt Ol</h1>
      <form onSubmit={handleRegister} className="flex flex-col gap-3 w-80">
        <input
          type="text"
          placeholder="Adınız"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 rounded"
          required
        />
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
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
          required
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Kayıt Ol
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
