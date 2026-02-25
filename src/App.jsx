import { Routes, Route } from "react-router-dom";
import Store from "./components/Store";
import Cart from "./components/Cart";
import Home from "./components/Home";
import Main from "./components/Main";
import SimpleLayout from "./components/SimpleLayout";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <div className="bg-purple-50 selection:bg-purple-300 min-h-screen">
      <ScrollToTop /> {/* <--- It lives here! */}
      <Routes>
        <Route element={<Main />}>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<Cart />} />
        </Route>

        <Route element={<SimpleLayout />}>
          <Route path="/store" element={<Store />} />
        </Route>
      </Routes>
    </div>
  );
}
export default App;
