export interface Doctor {
  id: number;
  name: string;       // artık zorunlu
  email: string;      // artık zorunlu
  specialty?: string;  // opsiyonel
  phone?: string;     // opsiyonel
}

export interface MyDoctor extends Doctor {
  status: "bekliyor" | "onaylandı" | "reddedildi";
  note?: string;
}
