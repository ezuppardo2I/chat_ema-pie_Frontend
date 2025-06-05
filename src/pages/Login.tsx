import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { poolData } from "../config";
import { useGlobalContext } from "../contexts/GlobalContext";
import { User } from "../model/User";
import { fetchAuthSession } from "@aws-amplify/auth";

export default function Login() {
  const userPool = new CognitoUserPool(poolData);
  const {
    getUser,
    setIsLoggedIn,
    setUser,
    pubsub,
    activeLobby,
    setLobbies,
    setLobbiesUpdate,
    connectToIoT,
    subLobby,
    user,
    setSubLobby,
  } = useGlobalContext();

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")!.toString();
    const password = formData.get("password")!.toString();

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: async (session) => {
        const idToken = session.getIdToken().getJwtToken();
        const payload = JSON.parse(atob(idToken.split(".")[1]));
        const userID = payload.sub;

        const resGetUser = await getUser(userID);

        setUser(
          new User(
            resGetUser.body.data.userID,
            resGetUser.body.data.email,
            resGetUser.body.data.username,
            resGetUser.body.data.avatarImage,
            resGetUser.body.data.lobbiesIDs
          )
        );

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
                  setLobbies((prev: any[]) => {
                    return prev.map((lobby) => {
                      if (
                        lobby.lobbyID === message.lobbyID &&
                        message.userID !== user.userID
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

                console.log("Lobbies update received:", message);
              },
            })
          );
        } catch (error) {
          console.error("Error subscribing to lobbies update:", error);
        }
      },
      onFailure: (err) => {
        if (err.code === "UserNotConfirmedException") {
          alert("L'utente non ha ancora confermato l'email.");
        } else {
          alert(err.message || JSON.stringify(err));
        }
      },
    });
  }

  return (
    <>
      <div className="wrapperLoginSignin">
        <h3>Login</h3>
        <form onSubmit={handleLogin}>
          <div className="containerLoginSignin">
            <input
              className="form-control"
              type="email"
              name="email"
              id="email"
              placeholder="email"
            />
            <input
              className="form-control"
              type="password"
              name="password"
              id="password"
              placeholder="password"
            />
            <button className="btn btn-primary" type="submit">
              Accedi
            </button>
          </div>
        </form>
        <div className="containerLogin">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsLoggedIn(true);
            }}
          >
            Altrimenti registrati
          </a>
        </div>
      </div>
    </>
  );
}
