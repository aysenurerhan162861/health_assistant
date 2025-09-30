import React, { useState } from "react";
import { useRouter } from "next/router";
import { registerUser, ApiResponse } from "../../services/api";

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "citizen",
  });
  const [message, setMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await registerUser(formData);

      // backend hata fırlattıysa error message olarak dönsün
      if ((res as any).detail) {
        setMessage((res as any).detail);
      } else if (res.message) {
        setMessage(res.message + " Giriş sayfasına yönlendiriliyorsunuz...");
        setTimeout(() => router.push("/login"), 1500); // yönlendirme
      } else {
        setMessage("Beklenmedik bir hata oluştu.");
      }
    } catch (err: any) {
      setMessage(err?.message || "Kayıt başarısız!");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto" }}>
      <h2>Kayıt Ol</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <input
          type="text"
          name="name"
          placeholder="Adınız"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Şifre"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <label htmlFor="role">Kullanıcı Tipi:</label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="citizen">Vatandaş</option>
          <option value="doctor">Doktor / Klinisyen</option>
        </select>
        <button type="submit">Kayıt Ol</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
