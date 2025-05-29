import type { CognitoUser } from "amazon-cognito-identity-js";
import { createContext, useContext, useState, type ReactNode } from "react";

type GlobalContextType = {
  signInUser: {
    username: string;
    email: string;
  } | null;
  setSignInUser: (user: { username: string; email: string }) => void;
  putUser: (user: string, email: string, username: string) => Promise<void>;
};

const GlobalContext = createContext<GlobalContextType>({
  signInUser: null,
  setSignInUser: () => {},
  putUser: async () => {},
});

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [signInUser, setSignInUser] = useState({
    username: "",
    email: "",
  });

  async function putUser(user: string, email: string, username: string) {
    await fetch(
      "https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/user",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: user,
          username: username,
          email: email,
        }),
      }
    );
  }

  return (
    <GlobalContext.Provider value={{ signInUser, setSignInUser, putUser }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
