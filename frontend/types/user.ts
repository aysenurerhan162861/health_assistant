// frontend/types/User.ts
export interface User {
  id?: number;
  name?: string;
  email?: string;
  role?: string;
  photoUrl?: string;

   // Hasta özel alanları
  chronic_diseases?: string; 
  age?: number;
  gender?: string;
}
