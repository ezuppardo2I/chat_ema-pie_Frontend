import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { poolData } from "../config";
import { useGlobalContext } from "../contexts/GlobalContext";
import { User } from "../model/User";

interface LoginProps {
  setIsSignIned: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Login({ setIsSignIned }: LoginProps) {
  const userPool = new CognitoUserPool(poolData);
  const { putUser, getUser, setIsLoggedIn, setUser } = useGlobalContext();

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
        console.log("Login effettuato con successo", idToken);
        const payload = JSON.parse(atob(idToken.split(".")[1]));
        const userID = payload.sub;

        const resGetUser = await getUser(userID);

        if (resGetUser.status === 404) {
          await putUser(userID, email);
        } else {
          console.log("Utente già esistente", resGetUser);
        }
        setIsLoggedIn(true);
        const res = await getUser(userID);
        console.log("User fetched:", res);
        setUser(
          new User(
            res.body.userID,
            res.body.email,
            res.body.avatarImage,
            res.body.lobbiesIDs
          )
        );
      },
      onFailure: (err) => {
        alert(err.message || JSON.stringify(err));
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
              placeholder="Email"
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
              setIsSignIned((prev: boolean) => !prev);
            }}
          >
            Altrimenti registrati
          </a>
        </div>
      </div>
    </>
  );
}
