import Link from "next/link";
import React from "react";

const page = () => {
  return (
    <div>
      <Link href={"/Homepage"} className="text-amber-900">
        Homepage
      </Link>
      <Link
        href={"/Signup"}
        className="text-red-500 bg-blue-500 text-2xl mr-20"
      >
        Signup
      </Link>
      <Link href={"/Signin"}>Signin</Link>
      <h1>Welcome to the Home Page</h1>
      <p>This is the main content of the home page.</p>
    </div>
  );
};

export default page;
