import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from "amazon-cognito-identity-js";
import { poolData } from "../config";
import { useGlobalContext } from "../contexts/GlobalContext";

export default function Login() {
  const userPool = new CognitoUserPool(poolData);
  const { putUser, getUser } = useGlobalContext();

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

        await putUser(userID, email);
      },
      onFailure: (err) => {
        alert(err.message || JSON.stringify(err));
      },
    });
  }

  return (
    <>
      <div>
        <form onSubmit={handleLogin}>
          <input
            className="form-control"
            type="email"
            name="email"
            id="email"
          />
          <input
            className="form-control"
            type="password"
            name="password"
            id="password"
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </>
  );
}
