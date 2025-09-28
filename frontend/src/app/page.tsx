
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "./Homepage/page";

async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const res = await fetch("http://localhost:8000/api/user/current", {
      headers: { cookie: `token=${token}` },
      cache: "no-store", // ensures fresh server-side fetch
    });

    if (!res.ok) return null;
    return res.json(); // should return user object
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


  // User not logged in → render the landing page
  return <LandingPage />;
}