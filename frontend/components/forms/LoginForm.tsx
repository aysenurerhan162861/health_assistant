import React, { useState } from "react";
import { useRouter } from "next/router";
import { loginUser, ApiResponse } from "../../services/api";

export default function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res: ApiResponse = await loginUser(formData);
      if (res.error) {
        setMessage(res.error);
      } else if (res.token && res.user) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        setMessage("Giriş başarılı!");
        setTimeout(() => router.push("/dashboard"), 500); // login sonrası dashboarda yönlendir
      }
    } catch (err) {
      setMessage("Giriş başarısız!");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <h2>Giriş Yap</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Şifre" value={formData.password} onChange={handleChange} required />
        <button type="submit">Giriş</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
