// utils/fetchData.js
export default async function fetchData() {
  const res = await fetch("/api/yahoo");
  if (!res.ok) {
    throw new Error("Failed to fetch data from API route");
  }
  return res.json();
}
