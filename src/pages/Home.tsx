import { use, useEffect, useState } from "react";
import SignIn from "../components/SignIn";
import Login from "./Login";
import {
  CognitoUser,
  CognitoUserPool,
  type CognitoUserSession,
} from "amazon-cognito-identity-js";
import { poolData } from "../config";
import { useGlobalContext } from "../contexts/GlobalContext";
import { fetchAuthSession } from "aws-amplify/auth";
import { ConnectionState } from "aws-amplify/api";
import { Hub } from "aws-amplify/utils";
import { User } from "../model/User";

export default function Home() {
  const {
    isLoggedIn,
    setIsLoggedIn,
    connectToIoT,
    patchUserLobbies,
    user,
    getUser,
    setUser,
    putLobby,
    getUsers,
    getLobby,
    getMessages,
    putMessage,
    isSignedIn,
    pubsub,
    setLobbiesUpdate,
    activeLobby,
    setActiveLobby,
    lobbies,
    setLobbies,
    subLobby,
    setSubLobby,
  } = useGlobalContext();
  const userPool = new CognitoUserPool(poolData);
  const [users, setUsers] = useState<User[]>([]);
  const [userIDs, setUserIDs] = useState<string[]>([]);
  const [userID, setUserID] = useState<string>("default");
  const [messagesList, setMessagesList] = useState<any[]>([]);

  const [sub, setSub] = useState<any>(null);
  const [usersInfo, setUsersInfo] = useState<any[]>([]);

  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const currentUser = userPool.getCurrentUser();

    if (currentUser) {
      currentUser.getSession(
        async (err: Error, session: CognitoUserSession | null) => {
          if (err || !session || !session.isValid()) {
            setIsLoggedIn(false);
            return;
          }
          const idToken = session.getIdToken().getJwtToken();
          const userID = JSON.parse(atob(idToken.split(".")[1])).sub;
          setIsLoggedIn(true);
          const info = await fetchAuthSession();
          connectToIoT(info.identityId);
          try {
            setSubLobby(
              pubsub.subscribe({ topics: ["lobbies-update"] }).subscribe({
                next: (message) => {
                  if (
                    message.messageText &&
                    message.messageText === "Nuovo messaggio in lobby" &&
                    message.lobbyID !== activeLobby?.lobbyID
                  ) {
                    console.log(
                      "message.lobbyID !== activeLobby?.lobbyID: ",
                      message.lobbyID,
                      activeLobby.lobbyID
                    );
                    console.log("New message in lobby:", message.lobbyID);
                    setLobbies((prev: any[]) => {
                      return prev.map((lobby) => {
                        if (lobby.lobbyID === message.lobbyID) {
                          lobby.messageText = true;
                        }
                        return lobby;
                      });
                    });
                  }

                  setLobbiesUpdate((prev: any) => [...prev, message]);

                  console.log("Lobbies update received:", message);
                },
              })
            );
          } catch (error) {
            console.error("Error subscribing to lobbies update:", error);
          }

          const res = await getUser(userID);
          setUser(
            new User(
              res.body.data.userID,
              res.body.data.email,
              res.body.data.username,
              res.body.data.avatarImage,
              res.body.data.lobbiesIDs
            )
          );
        }
      );
    }
  }, []);

  useEffect(() => {
    if (subLobby !== null) {
      subLobby.unsubscribe();
      setSubLobby(null);
    }

    const subscribeToLobbiesUpdate = async () => {
      const info = await fetchAuthSession();
      connectToIoT(info.identityId);
      try {
        pubsub.subscribe({ topics: ["lobbies-update"] }).subscribe({
          next: (message) => {
            if (
              message.messageText &&
              message.messageText === "Nuovo messaggio in lobby" &&
              message.lobbyID !== activeLobby?.lobbyID
            ) {
              console.log(
                "message.lobbyID !== activeLobby?.lobbyID: ",
                message.lobbyID,
                activeLobby.lobbyID
              );
              console.log("New message in lobby:", message.lobbyID);
              setLobbies((prev: any[]) => {
                return prev.map((lobby) => {
                  if (lobby.lobbyID === message.lobbyID) {
                    lobby.messageText = true;
                  }
                  return lobby;
                });
              });
            }

            setLobbiesUpdate((prev: any) => [...prev, message]);

            console.log("Lobbies update received:", message);
          },
        });
      } catch (error) {
        console.error("Error subscribing to lobbies update:", error);
      }
    };

    subscribeToLobbiesUpdate();
  }, [activeLobby]);

  useEffect(() => {
    if (!user || !user.lobbiesIDs) return;

    const fetchLobbies = async () => {
      const promises = user.lobbiesIDs.map((lobbyID) => getLobby(lobbyID));
      const results = await Promise.all(promises);

      const enrichedResults = results.map((lobby) => ({
        ...lobby,
        messageText: false,
      }));

      setLobbies(enrichedResults);
    };

    fetchLobbies();
  }, [user]);

  function handleCloseModal() {
    setUserIDs([]);
    setUserID("default");
  }

  async function loadUsersInfo(userIDsActiveLobby: string[]) {
    const usersInfoData = await Promise.all(
      userIDsActiveLobby.map(async (userID) => {
        const response = await getUser(userID);
        return new User(
          response.body.data.userID,
          response.body.data.email,
          response.body.data.username,
          response.body.data.avatarImage,
          response.body.data.lobbiesIDs
        );
      })
    );
    setUsersInfo(usersInfoData);
  }

  function handleLogout() {
    const cognitoUser = new CognitoUser({
      Username: userPool.getCurrentUser()!.getUsername(),
      Pool: userPool,
    });
    cognitoUser.signOut();
    setIsLoggedIn(false);
  }

  async function handleIotConnection(lobby: any) {
    if (sub !== null) {
      sub.unsubscribe();
      setSub(null);
    }
    setMessagesList([]);
    setActiveLobby(lobby);
    const lobbyID = lobby.lobbyID;
    const userIDsActiveLobby = lobby.userIDs;

    setUsersInfo([]);
    await loadUsersInfo(userIDsActiveLobby);

    setMessagesList(await getMessages(lobbyID));

    setSub(
      pubsub.subscribe({ topics: [lobbyID] }).subscribe({
        next: (data) => {
          setMessagesList((prev) => [data, ...prev]);
        },
      })
    );

    setLobbies((prev: any[]) => {
      return prev.map((lobbyItem) => {
        if (lobbyItem.lobbyID === lobbyID) {
          lobbyItem.messageText = false;
        }
        return lobbyItem;
      });
    });

    let priorConnectionState: ConnectionState;

    Hub.listen("pubsub", (data: any) => {
      const { payload } = data;
      if (true) {
        if (
          priorConnectionState === ConnectionState.Connecting &&
          payload.data.connectionState === ConnectionState.Connected
        ) {
          console.log(payload.data.connectionState);
        }
        priorConnectionState = payload.data.connectionState;
      }
    });
  }

  async function handlePutLobby(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")!.toString();

    const lobbyID = await putLobby(name, [...userIDs, user.userID]);

    userIDs.forEach(async (id) => {
      const userID = id;
      await patchUserLobbies(userID, [lobbyID]);
    });

    try {
      await pubsub.publish({
        topics: ["lobbies-update"],
        message: {
          lobbyID: lobbyID,
          userIDs: [...userIDs, user.userID],
        },
      });

      setMessageText("");
    } catch (error) {
      console.error("Error publishing message:", error);
    }

    await patchUserLobbies(user.userID, [lobbyID]);
    const res = await getUser(user.userID);
    setUser(
      new User(
        res.body.data.userID,
        res.body.data.email,
        res.body.data.username,
        res.body.data.avatarImage,
        res.body.data.lobbiesIDs
      )
    );

    setUserIDs([]);
    setUserID("default");
  }

  function handleAddUserToLobby(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (userID) {
      setUserIDs((prev) => [...prev, userID]);
    }
  }

  async function handleGetUsers() {
    const allUsers = await getUsers();

    const filteredUsers = allUsers
      .filter((userMap: any) => userMap.userID !== user.userID)
      .map(
        (userMap: any) =>
          new User(
            userMap.userID,
            userMap.email,
            userMap.username,
            userMap.avatarImage,
            userMap.lobbiesIDs
          )
      );

    setUsers(filteredUsers);
  }

  async function handlePutMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMessage = await putMessage(
      activeLobby.lobbyID,
      messageText,
      user.userID
    );

    try {
      await pubsub.publish({
        topics: [activeLobby.lobbyID],
        message: {
          messageID: newMessage.messageID,
          lobbyID: newMessage.lobbyID,
          userID: newMessage.userID,
          messageText: newMessage.messageText,
          timestamp: newMessage.timestamp,
        },
      });

      await pubsub.publish({
        topics: ["lobbies-update"],
        message: {
          lobbyID: activeLobby.lobbyID,
          messageText: "Nuovo messaggio in lobby",
        },
      });

      setMessageText("");
    } catch (error) {
      console.error("Error publishing message:", error);
    }
  }

  return (
    <>
      <div
        className="modal fade"
        id="exampleModal"
        tabIndex={-1}
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                Crea una nuova lobby
              </h1>
              <button
                type="button"
                className="btn-close"
                onClick={handleCloseModal}
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <form onSubmit={handlePutLobby}>
              <div className="modal-body">
                <input
                  className="form-control"
                  type="text"
                  name="name"
                  id="name"
                  placeholder="nome"
                />

                <select
                  name="userIDs"
                  id="userIDs"
                  onChange={(e) => setUserID(e.target.value)}
                  value={userID}
                >
                  <option value="default">Seleziona utenti</option>
                  {users.map((user) => (
                    <option key={user.userID} value={user.userID}>
                      {user.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddUserToLobby}
                  className="btn btn-primary"
                >
                  Aggiungi membro
                </button>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  data-bs-dismiss="modal"
                >
                  Crea
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {isLoggedIn ? (
        <>
          <div className="logout-button-container">
            <button onClick={handleLogout} className="btn btn-danger">
              Logout
            </button>
          </div>
          <div className="chat-wrapper">
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-header-avatar">
                  <img src={user.avatarImage} alt={user.userID} />
                </div>
                <h3>Ciao, {user.username}</h3>
              </div>
              <div>
                <button
                  onClick={handleGetUsers}
                  data-bs-toggle="modal"
                  data-bs-target="#exampleModal"
                  className="btn btn-primary"
                >
                  Aggiungi lobby
                </button>
              </div>
            </div>
            <div className="chat-content">
              <div className="chat-lobbies">
                <h4>Elenco lobby</h4>
                {lobbies.map((lobby: any) => (
                  <div
                    key={lobby.lobbyID}
                    className={`chat-lobby ${
                      activeLobby?.lobbyID === lobby.lobbyID ? "active" : ""
                    }`}
                    onClick={() => handleIotConnection(lobby)}
                  >
                    <h5>{lobby.name}</h5>
                    <div
                      className={`status-new-message ${
                        lobby.messageText ? "new-message" : ""
                      }`}
                    ></div>
                  </div>
                ))}
              </div>
              <div className="chat-messages">
                {activeLobby != null ? (
                  <>
                    <div className="chat-messages-header">
                      <h3>{activeLobby.name}</h3>
                    </div>
                    <div className="chat-messages-content">
                      {messagesList ? (
                        [...messagesList].reverse().map((message, index) => {
                          const userInfo = usersInfo.find(
                            (user) => user.userID === message.userID
                          );
                          if (userInfo) {
                            return (
                              <div
                                className={`container-message ${
                                  message.userID === user.userID
                                    ? "own-container-message"
                                    : ""
                                }`}
                              >
                                <div className="message-avatar">
                                  <img
                                    src={userInfo.avatarImage}
                                    alt={message.userID}
                                  />
                                </div>
                                <div
                                  key={index}
                                  className={`chat-message ${
                                    message.userID === user.userID
                                      ? "own-chat-message"
                                      : ""
                                  }`}
                                >
                                  <div className="message-info">
                                    <div className="messageText-container">
                                      <strong>{userInfo.username}</strong>
                                      <span>{message.messageText}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        })
                      ) : (
                        <span>nessun messaggio</span>
                      )}
                    </div>
                    <div className="chat-messages-footer">
                      <form
                        className="input-message-container"
                        onSubmit={handlePutMessage}
                      >
                        <input
                          className="form-control"
                          type="text"
                          name="messageText"
                          id="messageText"
                          placeholder="inserisci il tuo messaggio"
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                        />
                        <div className="send-button-container">
                          <button className="btn btn-primary" type="submit">
                            Invia
                          </button>
                        </div>
                      </form>
                    </div>
                  </>
                ) : (
                  <span>Seleziona una lobby</span>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <>{isSignedIn ? <Login /> : <SignIn />}</>
      )}
    </>
  );
}
