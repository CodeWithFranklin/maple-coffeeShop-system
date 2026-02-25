import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function SimpleLayout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}
