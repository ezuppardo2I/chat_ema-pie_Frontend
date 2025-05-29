import {
  CognitoUserPool,
  CognitoUserAttribute,
  type ISignUpResult,
  CognitoUser,
} from "amazon-cognito-identity-js";

import { poolData } from "../config";
import { useState } from "react";

export default function Home() {
  const [isLogged, setIsLogged] = useState(false);

  console.log(poolData);

  async function putUser(user: CognitoUser, email: string, username: string) {
    console.log(user);

    const res = await fetch(
      "https://athx0w7rcf.execute-api.eu-west-2.amazonaws.com/dev/user",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userID: user.getUsername(),
          username: username,
          email: email,
        }),
      }
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")!.toString();
    const username = formData.get("username")!.toString();
    const password = formData.get("password")!.toString();
    const userPool = new CognitoUserPool(poolData);
    const attributeList = [];
    const dataEmail = {
      Name: "email",
      Value: email,
    };
    const attributeEmail = new CognitoUserAttribute(dataEmail);
    attributeList.push(attributeEmail);
    userPool.signUp(
      email,
      password,
      attributeList,
      [],
      function (err: Error | undefined, result: ISignUpResult | undefined) {
        if (err) {
          console.log("Errore Cognito:", err);
          if ((err as any).code === "UsernameExistsException") {
            alert("Utente già esistente");
          } else {
            alert(err.message || JSON.stringify(err));
          }
          return;
        }
        if (result && result.user) {
          putUser(result.user, email, username);
        } else {
          console.error("Nessun utente restituito");
        }
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
        <a onClick={handleSignIn}>login</a>
      </div>
    </>
  );
}
