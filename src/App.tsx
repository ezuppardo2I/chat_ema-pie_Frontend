import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import DefaultLayout from "./layouts/DefaultLayout";
import Home from "./pages/Home";
import { GlobalProvider } from "./contexts/GlobalContext";
import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: "jl7gandp81d22bkn0b23lgops",
      userPoolId: "eu-west-2_zb5EDjVB0",
      identityPoolId: "eu-west-2:36be2b16-799d-4dbc-9220-cfe91308b8ed",
    },
  },
});

function App() {
  return (
    <>
      <GlobalProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DefaultLayout />}>
              <Route index element={<Home />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </GlobalProvider>
    </>
  );
}

export default App;
