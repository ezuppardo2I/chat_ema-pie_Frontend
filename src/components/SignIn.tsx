import {
  CognitoUserPool,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import { poolData } from "../config";
import { useGlobalContext } from "../contexts/GlobalContext";

interface LoginProps {
  setIsSignIned: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function SignIn({ setIsSignIned }: LoginProps) {
  const userPool = new CognitoUserPool(poolData);
  const { setIsLoggedIn } = useGlobalContext();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email")!.toString();
    const password = formData.get("password")!.toString();
    const username = formData.get("username")!.toString();

    const attributeEmail = new CognitoUserAttribute({
      Name: "email",
      Value: email,
    });
    const attributeUsername = new CognitoUserAttribute({
      Name: "custom:username",
      Value: username,
    });

    userPool.signUp(
      email,
      password,
      [attributeEmail, attributeUsername],
      [],
      async function (err: Error | undefined) {
        if (err) {
          alert(err.message || JSON.stringify(err));
          return;
        }
        setIsLoggedIn(true);
      }
    );

    // if (avatarImage != null) {
    //   try {
    //     const url = await getPresignedUrl();

    //     const urlAvatarImage = (await putImage(url, avatarImage))
    //       ? "https://chat-avatar-bucket.s3.eu-west-2.amazonaws.com/" +
    //         isFirstLogin.userID
    //       : null;
    //     await putUser(
    //       isFirstLogin.userID,
    //       isFirstLogin.email,
    //       username,
    //       urlAvatarImage!
    //     );

    //     const resGetUser = await getUser(isFirstLogin.userID);

    //     setUser(
    //       new User(
    //         resGetUser.body.data.userID,
    //         resGetUser.body.data.email,
    //         resGetUser.body.data.username,
    //         resGetUser.body.data.avatarImage,
    //         resGetUser.body.data.lobbiesIDs
    //       )
    //     );

    //     setIsFirstLogin({ status: false, userID: "", email: "" });
    //   } catch (error) {
    //     console.error("Error creating user:", error);
    //     return;
    //   }
    // }
  }

  return (
    <>
      <div className="wrapperLoginSignin">
        <h3>Registrazione</h3>
        <form onSubmit={handleSubmit}>
          <div className="containerLoginSignin">
            <label htmlFor="email">Email *</label>
            <input
              className="form-control"
              type="email"
              name="email"
              id="email"
              required
            />
            <label htmlFor="password">Password *</label>
            <input
              className="form-control"
              type="password"
              name="password"
              id="password"
              required
            />
            <label htmlFor="username">Username *</label>
            <input
              className="form-control"
              type="text"
              id="username"
              name="username"
              required
            />

            <button className="btn btn-primary" type="submit">
              Registrati
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
            Altrimenti accedi
          </a>
        </div>
      </div>
    </>
  );
}
