import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import API from '../services/api';

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login'); // Token yoksa login sayfasına yönlendir
    } else {
      // Basit test: token varsa kullanıcıyı al (backend’e GET /me gibi bir endpoint ekleyebilirsin)
      setUser({ email: 'user@example.com' }); // placeholder
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
      {user ? (
        <p>Hoşgeldiniz, {user.email}!</p>
      ) : (
        <p>Yükleniyor...</p>
      )}
      <p>
        <a href="/register" className="text-blue-500 underline">Kayıt Ol</a> | 
        <a href="/login" className="text-blue-500 underline ml-2">Giriş Yap</a>
      </p>
    </div>
  );
}
