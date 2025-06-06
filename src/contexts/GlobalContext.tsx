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
  activeLobby: any | null;
  setActiveLobby: React.Dispatch<React.SetStateAction<any | null>>;
  lobbies: any[];
  setLobbies: React.Dispatch<React.SetStateAction<any[]>>;
  subLobby: any | null;
  setSubLobby: React.Dispatch<React.SetStateAction<any | null>>;
  openSubscribeLobbiesUpdate: () => void;
  closeSubscribeLobbiesUpdate: () => void;
  isProfile: boolean;
  setIsProfile: React.Dispatch<React.SetStateAction<boolean>>;
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
  activeLobby: null,
  setActiveLobby: () => {},
  lobbies: [],
  setLobbies: () => {},
  subLobby: null,
  setSubLobby: () => {},
  openSubscribeLobbiesUpdate: async () => {},
  closeSubscribeLobbiesUpdate: () => {},
  isProfile: false,
  setIsProfile: () => {},
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
  const [activeLobby, setActiveLobby] = useState<any | null>(null);
  const [lobbies, setLobbies] = useState<any>([]);
  const [subLobby, setSubLobby] = useState<any>(null);
  const [isProfile, setIsProfile] = useState<boolean>(false);

  useEffect(() => {
    const lastMessage = lobbiesUpdate[lobbiesUpdate.length - 1];
    if (
      lastMessage?.messageText &&
      lastMessage?.messageText === "Nuovo messaggio in lobby"
    ) {
      return;
    } else {
      lastMessage?.userIDs.forEach(async (userID: any) => {
        if (userID === user.userID) {
          const newUser = await getUser(userID);
          setUser(
            new User(
              newUser.body.data.userID,
              newUser.body.data.email,
              newUser.body.data.username,
              newUser.body.data.avatarImage,
              newUser.body.data.lobbiesIDs
            )
          );
        }
      });
    }
  }, [lobbiesUpdate]);

  useEffect(() => {
    closeSubscribeLobbiesUpdate();
    if (activeLobby != null && isLoggedIn == true) openSubscribeLobbiesUpdate();
  }, [activeLobby]);

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
    console.log(res && "CONNECTED TO IOT");
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

  function openSubscribeLobbiesUpdate(): void {
    try {
      setSubLobby(
        pubsub.subscribe({ topics: ["lobbies-update"] }).subscribe({
          next: (message) => {
            if (
              message.messageText &&
              message.messageText === "Nuovo messaggio in lobby" &&
              message.lobbyID !== activeLobby?.lobbyID
            ) {
              setLobbies((prev: any[]) => {
                return prev.map((lobby) => {
                  if (
                    lobby.lobbyID === message.lobbyID &&
                    message.userID != user.userID
                  ) {
                    return {
                      ...lobby,
                      messageText: true,
                    };
                  }
                  return lobby;
                });
              });
            }

            setLobbiesUpdate((prev: any) => [...prev, message]);
          },
        })
      );
    } catch (error) {
      console.error("Error subscribing to lobbies update:", error);
    }
  }

  function closeSubscribeLobbiesUpdate(): void {
    if (subLobby != null) subLobby.unsubscribe();
  }

  return (
    <GlobalContext.Provider
      value={{
        isProfile,
        setIsProfile,
        closeSubscribeLobbiesUpdate,
        lobbies,
        setLobbies,
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
        activeLobby,
        setActiveLobby,
        subLobby,
        setSubLobby,
        openSubscribeLobbiesUpdate,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobalContext() {
  return useContext(GlobalContext);
}
