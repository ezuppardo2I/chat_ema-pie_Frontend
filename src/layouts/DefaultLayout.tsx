import { Outlet } from "react-router-dom";

export default function DefaultLayout() {
  return (
    <div>
      <header>
        <nav></nav>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}
