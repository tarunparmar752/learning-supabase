import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState("");
  useEffect(() => {
    fetch("http://localhost:3000/api/v1/users")
      .then((res) => res.json())
      .then((data) => setData(data.message));
  }, []);
  return <div>{data}</div>;
}
