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
import { ConnectionState } from "aws-amplify/api";
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
  } = useGlobalContext();
  const [isSignIned, setIsSignIned] = useState(true);
  const userPool = new CognitoUserPool(poolData);
  const [users, setUsers] = useState<User[]>([]);
  const [userIDs, setUserIDs] = useState<string[]>([]);
  const [userID, setUserID] = useState<string>("");

  console.log(users);

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

          setUsers(
            (await getUsers()).map((user: any) => {
              const newUser = new User(
                user.userID,
                user.email,
                user.avatarImage,
                user.lobbiesIDs
              );
              console.log("utente" + newUser);
              return newUser;
            })
          );
        }
      );
    }
  }, []);

  function handleLogout() {
    const cognitoUser = new CognitoUser({
      Username: userPool.getCurrentUser()!.getUsername(),
      Pool: userPool,
    });
    cognitoUser.signOut();
    setIsLoggedIn(false);
  }

  async function handleIotConnection() {
    const info = await fetchAuthSession();
    connectToIoT(info.identityId);

    const pubsub = new PubSub({
      region: "eu-west-2",
      endpoint: "wss://a238raa4ef5q2d-ats.iot.eu-west-2.amazonaws.com/mqtt",
    });

    pubsub.subscribe({ topics: ["test"] }).subscribe({
      next: (data) => {
        console.log(data);
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

    setUserIDs([]);
    setUserID("");
  }

  function handleAddUserToLobby(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (userID) {
      setUserIDs((prev) => [...prev, userID]);
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
                >
                  <option value="">Seleziona utenti</option>
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
              <button
                data-bs-toggle="modal"
                data-bs-target="#exampleModal"
                className="btn btn-primary"
              >
                Aggiungi lobby
              </button>
            </div>
            <div className="chat-content">
              <div className="chat-lobbies"></div>
              <div className="chat-messages"></div>
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
