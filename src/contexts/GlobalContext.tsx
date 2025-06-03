import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { User } from "../model/User";

type GlobalContextType = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
  putUser: (userID: string, email: string) => Promise<void>;
  getUser: (userID: string) => Promise<any>;
  connectToIoT: (cognitoIdentityID: string | undefined) => Promise<void>;
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  putLobby: (name: string, userIDs: string[]) => Promise<any>;
  getUsers: () => Promise<any>;
  patchUserLobbies: (userID: string, lobbyID: string[]) => Promise<void>;
  getLobby: (lobbyID: string) => Promise<any>;
  getMessages: (lobbyID: string) => Promise<any>;
  putMessage: (
    lobbyID: string,
    messageText: string,
    userID: string
  ) => Promise<void>;
};

const GlobalContext = createContext<GlobalContextType>({
  setIsLoggedIn: () => {},
  isLoggedIn: false,
  putUser: async () => {},
  getUser: async () => {},
  connectToIoT: async () => {},
  setUser: () => {},
  user: new User("", "", "", []),
  putLobby: async () => {},
  getUsers: async () => {},
  patchUserLobbies: async () => {},
  getLobby: async () => {},
  getMessages: async () => {},
  putMessage: async () => {},
});

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>(new User("", "", "", []));

  useEffect(() => {
    if (isLoggedIn) {
    }
  }, [isLoggedIn]);

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
  }

  async function putLobby(name: string, userIDs: string[]) {
    const res = await fetch(
      "https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/lobby",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          userIDs: userIDs,
        }),
      }
    );

    const data = await res.json();
    return data.lobbyID;
  }

  async function getUsers() {
    const res = await fetch(
      "https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/user"
    );
    const data = await res.json();

    return data.data;
  }

  async function getLobby(lobbyID: string) {
    const res = await fetch(
      `https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/lobby/${lobbyID}`
    );
    const data = await res.json();

    return data.data;
  }

  async function getMessages(lobbyID: string) {
    const res = await fetch(
      `https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/message/${lobbyID}`
    );
    const data = await res.json();

    return data.data;
  }

  async function putMessage(
    lobbyID: string,
    messageText: string,
    userID: string
  ) {
    const res = await fetch(
      "https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/message",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lobbyID: lobbyID,
          messageText: messageText,
          userID: userID,
        }),
      }
    );
    const data = await res.json();
    return data.data;
  }

  async function patchUserLobbies(userID: string, lobbyID: string[]) {
    console.log("patchUserLobbies", userID, lobbyID);
    const res = await fetch(
      "https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/user/lobbies",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userID: userID,
          lobbiesIDs: lobbyID,
        }),
      }
    );
    console.log("patch" + res.json());
  }

  return (
    <GlobalContext.Provider
      value={{
        putMessage,
        putUser,
        getUser,
        setIsLoggedIn,
        isLoggedIn,
        connectToIoT,
        user,
        setUser,
        putLobby,
        getUsers,
        getLobby,
        patchUserLobbies,
        getMessages,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
