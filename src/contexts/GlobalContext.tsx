import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { User } from "../model/User";
import axios from "axios";

type GlobalContextType = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
  setIsFirstLogin: React.Dispatch<React.SetStateAction<any>>;
  isFirstLogin: any;
  putUser: (
    userID: string,
    email: string,
    username: string,
    avatarImage: string
  ) => Promise<void>;
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
  getPresignedUrl: (userID: string) => Promise<string>;
  putImage: (url: string, imageFile: File) => Promise<boolean>;
};

const GlobalContext = createContext<GlobalContextType>({
  setIsLoggedIn: () => {},
  isLoggedIn: false,
  setIsFirstLogin: () => {},
  isFirstLogin: { status: false, userID: "", email: "" },
  putUser: async () => {},
  getUser: async () => {},
  connectToIoT: async () => {},
  setUser: () => {},
  user: new User("", "", "", "", []),
  putLobby: async () => {},
  getUsers: async () => {},
  patchUserLobbies: async () => {},
  getLobby: async () => {},
  getMessages: async () => {},
  putMessage: async () => {},
  getPresignedUrl: async () => "",
  putImage: async () => false,
});

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>(new User("", "", "", "", []));
  const [isFirstLogin, setIsFirstLogin] = useState({
    status: false,
    userID: "56727264-0031-703e-6f27-245812578eb1",
    email: "ezuppardo@2innovation.it",
  });

  useEffect(() => {
    if (isLoggedIn) {
    }
  }, [isLoggedIn]);

  async function putUser(
    userID: string,
    email: string,
    username: string,
    avatarImage: string
  ) {
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
          username: username,
          avatarImage: avatarImage,
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

  async function getPresignedUrl(userID: string) {
    const data = await axios.get(
      `https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/imageurl/${userID}`
    );

    return data.data.content;
  }

  async function putImage(url: string, imageFile: File) {
    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": imageFile.type,
        },
        body: imageFile,
      });

      if (response.ok) {
        console.log("Immagine caricata con successo!");
        return true;
      } else {
        console.error("Caricamento immagine fallito:", response.statusText);
        return false;
      }
    } catch (error) {
      console.error("Errore durante il caricamento dell'immagine:", error);
      return false;
    }
  }

  return (
    <GlobalContext.Provider
      value={{
        isFirstLogin,
        setIsFirstLogin,
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
        getPresignedUrl,
        putImage,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
