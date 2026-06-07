import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function SimpleLayout() {
  return (
    <div>
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
