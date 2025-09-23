import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `http://localhost:8000/users?name=${name}&email=${email}`,
        { method: "POST" }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Bir hata oluştu");
      }

      const data = await res.json();
      setMessage("Kullanıcı eklendi: " + data.name);
      setName("");   // Formu temizle
      setEmail("");  // Formu temizle
    } catch (error) {
      setMessage("Hata: " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Kullanıcı Ekle</h1>
      <form onSubmit={handleSubmit}>
        <input placeholder="Ad" value={name} onChange={(e) => setName(e.target.value)} /><br />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} /><br />
        <button type="submit">Ekle</button>
      </form>
      <p>{message}</p>
    </div>
  );
}
