import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function SimpleLayout() {
  return (
    <div className="bg-base-300">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
