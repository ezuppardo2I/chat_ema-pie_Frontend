import { createContext, useContext, useState, type ReactNode } from "react";

type GlobalContextType = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
  putUser: (userID: string, email: string) => Promise<void>;
  getUser: (userID: string) => Promise<any>;
  connectToIoT: (cognitoIdentityID: string | undefined) => Promise<void>;
};

const GlobalContext = createContext<GlobalContextType>({
  setIsLoggedIn: () => {},
  isLoggedIn: false,
  putUser: async () => {},
  getUser: async () => {},
  connectToIoT: async () => {},
});

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  async function putUser(userID: string, email: string) {
    await fetch(
      "https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/user",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: userID,

          email: email,
        }),
      }
    );
  }

  async function getUser(userID: string) {
    const res = await fetch(
      `https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/user/${userID}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
    return {
      status: res.status,
      body: data,
    };
  }

  async function connectToIoT(cognitoIdentityID: string | undefined) {
    const res = await fetch(
      "https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/iot",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cognitoIdentityID: cognitoIdentityID }),
      }
    );
    const data = await res.json();
    console.log(data);
  }

  return (
    <GlobalContext.Provider
      value={{ putUser, getUser, setIsLoggedIn, isLoggedIn, connectToIoT }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
