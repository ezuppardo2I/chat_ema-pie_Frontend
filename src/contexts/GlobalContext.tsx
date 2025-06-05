import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { User } from "../model/User";
import axios from "axios";
import { PubSub } from "@aws-amplify/pubsub";

type GlobalContextType = {
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  isLoggedIn: boolean;
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
  ) => Promise<any>;
  getPresignedUrl: (userID: string) => Promise<string>;
  putImage: (url: string, imageFile: File) => Promise<boolean>;
  isSignedIn: boolean;
  setIsSignedIn: React.Dispatch<React.SetStateAction<boolean>>;
  setPubsub: React.Dispatch<React.SetStateAction<PubSub>>;
  pubsub: PubSub;
  lobbiesUpdate: any[];
  setLobbiesUpdate: React.Dispatch<React.SetStateAction<any[]>>;
};

const GlobalContext = createContext<GlobalContextType>({
  setIsLoggedIn: () => {},
  isLoggedIn: false,
  isSignedIn: false,
  setIsSignedIn: () => {},
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
  setPubsub: () => {},
  pubsub: new PubSub({
    region: "eu-west-2",
    endpoint: "wss://a238raa4ef5q2d-ats.iot.eu-west-2.amazonaws.com/mqtt",
  }),
  lobbiesUpdate: [],
  setLobbiesUpdate: () => {},
});

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<User>(new User("", "", "", "", []));
  const [pubsub, setPubsub] = useState(
    new PubSub({
      region: "eu-west-2",
      endpoint: "wss://a238raa4ef5q2d-ats.iot.eu-west-2.amazonaws.com/mqtt",
    })
  );
  const [lobbiesUpdate, setLobbiesUpdate] = useState<any[]>([]);

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
    await fetch(
      "https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/iot",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cognitoIdentityID: cognitoIdentityID }),
      }
    );
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
    return data.content;
  }

  async function patchUserLobbies(userID: string, lobbyID: string[]) {
    await fetch(
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
        lobbiesUpdate,
        setLobbiesUpdate,
        putMessage,
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
        setIsSignedIn,
        isSignedIn,
        setPubsub,
        pubsub,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
