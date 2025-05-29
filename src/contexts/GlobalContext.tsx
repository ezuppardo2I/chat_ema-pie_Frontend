// GlobalContext.tsx
import type { CognitoUser } from "amazon-cognito-identity-js";
import { createContext, useContext, useState, type ReactNode } from "react";

// Tipo per il context
type GlobalContextType = {
  signInUser: CognitoUser | null;
  setSignInUser: (user: CognitoUser) => void;
  putUser: (
    user: CognitoUser,
    email: string,
    username: string
  ) => Promise<void>;
};

// Valore iniziale (tipi dummy per inizializzazione)
const GlobalContext = createContext<GlobalContextType>({
  signInUser: null,
  setSignInUser: () => {},
  putUser: async () => {},
});

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [signInUser, setSignInUser] = useState<CognitoUser | null>(null);

  async function putUser(user: CognitoUser, email: string, username: string) {
    await fetch(
      "https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/user",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: user.getUsername(),
          username,
          email,
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
