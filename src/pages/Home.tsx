import { useEffect, useState } from "react";
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

    const lobbyID = await putLobby(name, [...userIDs, user.userId]);

    userIDs.forEach(async (id) => {
      const userID = id;
      await patchUserLobbies(userID, [lobbyID]);
    });

    await patchUserLobbies(user.userId, [lobbyID]);
    const res = await getUser(userID);
    setUser(
      new User(
        res.body.data.userID,
        res.body.data.email,
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
      .filter((userMap: any) => userMap.userID !== user.userId)
      .map(
        (userMap: any) =>
          new User(
            userMap.userID,
            userMap.email,
            userMap.avatarImage,
            userMap.lobbiesIDs
          )
      );

    setUsers(filteredUsers);
  }

  async function handlePutMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const messageText = formData.get("messageText")!.toString();

    await putMessage(activeLobby.lobbyID, messageText, user.userId);
    try {
      await pubsub.publish({
        topics: [activeLobby.lobbyID],
        message: {
          messageText,
          userID: user.userId,
        },
      });
    } catch (error) {
      console.error("Error publishing message:", error);
    }
    setMessagesList((prev) => [...prev, { messageText, userID: user.userId }]);
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
                    <option key={user.userId} value={user.userId}>
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
          {/* <p>loggato</p>
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
          <button onClick={handleIotConnection}>connessione iot</button>
          <p>
            Benvenuto {user.userId}, {user.email}, {user.lobbiesIDs}
          </p>
          <img src={user.avatarImage} alt="" /> */}

          <div className="chat-wrapper">
            <div className="chat-header">
              <h3>Ciao, {user.email}</h3>
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
                        messagesList.map((message, index) => (
                          <div key={index} className="chat-message">
                            <p>{message.messageText}</p>
                            <span>{message.userID}</span>
                          </div>
                        ))
                      ) : (
                        <span>nessun messaggio</span>
                      )}
                    </div>
                    <div className="chat-messages-footer">
                      <form onSubmit={handlePutMessage}>
                        <input
                          type="text"
                          name="messageText"
                          id="messageText"
                          placeholder="inserisci il tuo messaggio"
                        />
                        <button className="btn btn-primary" type="submit">
                          Invia
                        </button>
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
