import React, { useState } from "react";
import { Button, Typography } from "@mui/material";

interface Props {
  staffId: number;
  onFileSelected?: (file: File) => Promise<void>; // ✅ callback prop eklendi
}

export default function StaffFileUpload({ staffId, onFileSelected }: Props) {
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;
    console.log("Dosya yükleniyor:", file.name, "staffId:", staffId);

    if (onFileSelected) {
      try {
        await onFileSelected(file); // callback çağrılıyor
        setFile(null); // yükleme sonrası input sıfırlanabilir
      } catch (err) {
        console.error("Dosya yükleme hatası:", err);
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <Button variant="contained" onClick={handleUpload} disabled={!file}>
        Yükle
      </Button>
      {file && <Typography>Seçilen dosya: {file.name}</Typography>}
    </div>
  );
}
