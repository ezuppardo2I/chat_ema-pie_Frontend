import { useEffect, useState } from "react";
import SignIn from "../components/SignIn";
import Login from "./Login";

export default function Home() {
  const [isSignIned, setIsSignIned] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {}, []);

  return (
    <>
      {isSignIned ? (
        <Login setIsSignIned={setIsSignIned} />
      ) : (
        <SignIn setIsSignIned={setIsSignIned} />
      )}
    </>
  );
}
