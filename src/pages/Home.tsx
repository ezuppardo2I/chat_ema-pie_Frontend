import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  type ISignUpResult,
} from "amazon-cognito-identity-js";

import { poolData } from "../config";
import { useState } from "react";
import { useGlobalContext } from "../contexts/GlobalContext";

export default function Home() {
  const userPool = new CognitoUserPool(poolData);
  const { signInUser, setSignInUser, putUser } = useGlobalContext();
  const [confirmCodeSignIn, setConfirmCodeSignIn] = useState(false);

  function handleVerification(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = formData.get("code")!.toString();
    const cognitoUser = new CognitoUser({
      Username: signInUser!.email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, false, (err) => {
      if (err) {
        alert(err.message || JSON.stringify(err));
        return;
      }
      alert("Utente confermato con successo!");
    });

    putUser(cognitoUser.getUsername(), signInUser!.email, signInUser!.username);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")!.toString();
    const username = formData.get("username")!.toString();
    const password = formData.get("password")!.toString();

    const attributeEmail = new CognitoUserAttribute({
      Name: "email",
      Value: email,
    });

    userPool.signUp(
      email,
      password,
      [attributeEmail],
      [],
      async function (
        err: Error | undefined,
        result: ISignUpResult | undefined
      ) {
        if (err) {
          alert(err.message || JSON.stringify(err));
          return;
        }
        var cognitoUser = result?.user;
        console.log("user name is " + cognitoUser?.getUsername());
        setSignInUser({ username: username, email: email });
        setConfirmCodeSignIn(true);
      }
    );
  }

  function handleSignIn() {
    console.log("registrati");
  }

  return (
    <>
      <div className="wrapperLoginSignin">
        <form onSubmit={handleSubmit}>
          <div className="containerLoginSignin">
            <input
              type="text"
              name="username"
              id="username"
              placeholder="username"
              required
            />
            <input
              type="email"
              name="email"
              id="email"
              placeholder="email"
              required
            />
            <input
              type="password"
              name="password"
              id="password"
              placeholder="password"
              required
            />
            <button type="submit">Registrati</button>
          </div>
        </form>
        <a onClick={handleSignIn}>Registrati</a>
      </div>

      {confirmCodeSignIn ? (
        <div>
          <form onSubmit={handleVerification}>
            <input
              type="number"
              name="code"
              id="code"
              placeholder="verification code"
            />

            <button type="submit">Invia</button>
          </form>
        </div>
      ) : (
        ""
      )}
    </>
  );
}
