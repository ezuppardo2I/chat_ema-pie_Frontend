import {
  CognitoUserPool,
  CognitoUserAttribute,
  type ISignUpResult,
} from "amazon-cognito-identity-js";

import { poolData } from "../config";

export default function Home() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")!.toString();
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
          alert(err.message || JSON.stringify(err));
          return;
        }
        var cognitoUser = result?.user;
        console.log("user name is " + cognitoUser?.getUsername());
      }
    );
  }

  function handleSignIn() {
    console.log("registrati");
  }

  return (
    <>
      <div className="containerLogin">
        <input type="email" name="email" id="email" required />
        <input type="password" name="password" id="password" required />
        <button type="submit">Login</button>
        <a onClick={handleSignIn}>Registrati</a>
      </div>
    </>
  );
}
