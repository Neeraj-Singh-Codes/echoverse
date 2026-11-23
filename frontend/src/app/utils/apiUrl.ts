export const getApiUrl = (): string => {
  if (typeof window !== "undefined") {
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return "http://localhost:8000";
    }
  }
  return (
    process.env.NEXT_PUBLIC_API_URL || "https://echoverse-vcvg.onrender.com"
  );
};
