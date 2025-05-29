import { createContext, useContext, type ReactNode } from "react";

type GlobalContextType = {
  putUser: (userID: string, email: string) => Promise<void>;
};

const GlobalContext = createContext<GlobalContextType>({
  putUser: async () => {},
});

export function GlobalProvider({ children }: { children: ReactNode }) {
  async function putUser(userID: string, email: string) {
    await fetch(
      "https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/user",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: userID,

          email: email,
        }),
      }
    );
  }

  return (
    <GlobalContext.Provider value={{ putUser }}>
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
