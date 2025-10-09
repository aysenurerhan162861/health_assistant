import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login"); // /login sayfasına yönlendir
  }, [router]);

  return null; // boş sayfa, hemen yönlendirme yapacak
}
