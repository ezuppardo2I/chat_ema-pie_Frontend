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

export default function Home() {
  const { isLoggedIn, setIsLoggedIn, connectToIoT, user } = useGlobalContext();
  const [isSignIned, setIsSignIned] = useState(true);
  const userPool = new CognitoUserPool(poolData);

  useEffect(() => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.getSession(
        (err: Error, session: CognitoUserSession | null) => {
          if (err || !session || !session.isValid()) {
            setIsLoggedIn(false);
            return;
          }
          setIsLoggedIn(true);
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

  return (
    <>
      {isLoggedIn ? (
        <>
          <p>loggato</p>
          <button onClick={handleLogout} className="btn btn-danger">
            Logout
          </button>
          <button onClick={handleIotConnection}>connessione iot</button>
          <p>
            Benvenuto {user.userId}, {user.email}, {user.lobbiesIDs}
          </p>
          <img src={user.avatarImage} alt="" />
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
