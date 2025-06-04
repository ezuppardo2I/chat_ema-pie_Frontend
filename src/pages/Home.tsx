import { act, useEffect, useState } from "react";
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
import { ConnectionState, get } from "aws-amplify/api";
import { PubSub } from "@aws-amplify/pubsub";
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
    isFirstLogin,
    putUser,
    setIsFirstLogin,
    getPresignedUrl,
    putImage,
  } = useGlobalContext();
  const [isSignIned, setIsSignIned] = useState(true);
  const userPool = new CognitoUserPool(poolData);
  const [users, setUsers] = useState<User[]>([]);
  const [userIDs, setUserIDs] = useState<string[]>([]);
  const [userID, setUserID] = useState<string>("default");
  const [lobbies, setLobbies] = useState<any>([]);
  const [activeLobby, setActiveLobby] = useState<any | null>(null);
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [pubsub, setPubsub] = useState(
    new PubSub({
      region: "eu-west-2",
      endpoint: "wss://a238raa4ef5q2d-ats.iot.eu-west-2.amazonaws.com/mqtt",
    })
  );
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
    if (!user || !user.lobbiesIDs) return;
    user.lobbiesIDs.map(async (lobbyID) => {
      const res = await getLobby(lobbyID);
      setLobbies((prev: any) => [...prev, res]);
    });
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
    const info = await fetchAuthSession();
    connectToIoT(info.identityId);
    setActiveLobby(lobby);
    const lobbyID = lobby.lobbyID;
    const userIDsActiveLobby = lobby.userIDs;

    setUsersInfo([]);
    await loadUsersInfo(userIDsActiveLobby);

    setMessagesList(await getMessages(lobbyID));

    pubsub.subscribe({ topics: [lobbyID] }).subscribe({
      next: (data) => {
        setMessagesList((prev) => [...prev, data]);
      },
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

    await putMessage(activeLobby.lobbyID, messageText, user.userID);
    try {
      await pubsub.publish({
        topics: [activeLobby.lobbyID],
        message: {
          messageText,
          userID: user.userID,
        },
      });

      setMessageText("");
    } catch (error) {
      console.error("Error publishing message:", error);
    }
  }

  async function handleFirstLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get("username")!.toString();
    const avatarImage = formData.get("avatarImage") as File;

    try {
      const url = await getPresignedUrl(isFirstLogin.userID);
      console.log("userID:", isFirstLogin.userID);
      console.log("Presigned URL:", url);

      const urlAvatarImage = (await putImage(url, avatarImage))
        ? "https://chat-avatar-bucket.s3.eu-west-2.amazonaws.com/" +
          isFirstLogin.userID
        : null;
      await putUser(
        isFirstLogin.userID,
        isFirstLogin.email,
        username,
        urlAvatarImage!
      );

      const resGetUser = await getUser(isFirstLogin.userID);

      setUser(
        new User(
          resGetUser.body.data.userID,
          resGetUser.body.data.email,
          resGetUser.body.data.username,
          resGetUser.body.data.avatarImage,
          resGetUser.body.data.lobbiesIDs
        )
      );

      setIsFirstLogin({ status: false, userID: "", email: "" });
    } catch (error) {
      console.error("Error creating user:", error);
      return;
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
        isFirstLogin.status ? (
          <div className="chat-wrapper">
            <form onSubmit={handleFirstLogin}>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="inserisci username"
              />

              <label htmlFor="avatarImage">Inserisci immagine avatar</label>
              <input type="file" name="avatarImage" id="avatarImage" />
              <button type="submit">Invia</button>
            </form>
          </div>
        ) : (
          <>
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
                      className="chat-lobby"
                      onClick={() => handleIotConnection(lobby)}
                    >
                      <h5>{lobby.name}</h5>
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
                          messagesList.map((message, index) => {
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
                                  <div
                                    key={index}
                                    className={`chat-message ${
                                      message.userID === user.userID
                                        ? "own-chat-message"
                                        : ""
                                    }`}
                                  >
                                    <div className="message-sender-info">
                                      <strong>{userInfo.username}</strong>
                                      <div className="message-avatar">
                                        <img
                                          src={userInfo.avatarImage}
                                          alt={message.userID}
                                        />
                                      </div>
                                    </div>

                                    <span>{message.messageText}</span>
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
        )
      ) : (
        <>
          {isSignIned ? (
            <Login setIsSignIned={setIsSignIned} />
          ) : (
            <SignIn setIsSignIned={setIsSignIned} />
          )}
        </>
      )}
    </>
  );
}
