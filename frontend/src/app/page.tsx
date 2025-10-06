
import { redirect } from "next/navigation";
import LandingPage from "./Homepage/page";
import { cookies } from "next/headers";

async function getCurrentUser() {
  const cookieStore= cookies() as any;
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const res = await fetch("http://localhost:8000/api/user/current", {
      headers: { cookie: `token=${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    return null;
  }
}

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    if (!user.assistantImage) redirect("/Models");
    if (!user.assistantName) redirect("/ChooseName");
    redirect("/Mainpage");
  }

  return <LandingPage />;
}