import {
  CognitoUserPool,
  CognitoUserAttribute,
  CognitoUser,
  type ISignUpResult,
} from "amazon-cognito-identity-js";
import { poolData } from "../config";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const userPool = new CognitoUserPool(poolData);
  const [confirmCodeSignIn, setConfirmCodeSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  function handleVerification(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = formData.get("code")!.toString();
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, false, (err) => {
      if (err) {
        alert(err.message || JSON.stringify(err));
        return;
      }
      alert("Utente confermato con successo!");
      navigate("/login");
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")!.toString();
    const password = formData.get("password")!.toString();

    setEmail(email);

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
        <h3>Registrazione</h3>
        <form onSubmit={handleSubmit}>
          <div className="containerLoginSignin">
            <input
              className="form-control"
              type="email"
              name="email"
              id="email"
              placeholder="email"
              required
            />
            <input
              className="form-control"
              type="password"
              name="password"
              id="password"
              placeholder="password"
              required
            />
            <button className="btn btn-primary" type="submit">
              Registrati
            </button>
          </div>
        </form>
        <div className="containerLogin">
          <a onClick={handleSignIn}>Altrimenti accedi</a>
        </div>
      </div>

      {confirmCodeSignIn ? (
        <div>
          <form onSubmit={handleVerification}>
            <input
              className="form-control"
              type="number"
              name="code"
              id="code"
              placeholder="verification code"
            />

            <button className="btn btn-primary" type="submit">
              Invia
            </button>
          </form>
        </div>
      ) : (
        ""
      )}
    </>
  );
}
