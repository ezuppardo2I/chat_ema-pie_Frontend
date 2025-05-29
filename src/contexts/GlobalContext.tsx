import { createContext, useContext, type ReactNode } from "react";

type GlobalContextType = {
  putUser: (userID: string, email: string) => Promise<void>;
  getUser: (userID: string) => Promise<any>;
};

const GlobalContext = createContext<GlobalContextType>({
  putUser: async () => {},
  getUser: async () => {},
});

export function GlobalProvider({ children }: { children: ReactNode }) {
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
    return data;
  }

  return (
    <GlobalContext.Provider value={{ putUser, getUser }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
