import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import Home from "./components/Home";
import Main from "./components/Main";
import Order from "./components/Order";
import Store from "./components/Store";
import Checkout from "./components/Checkout";
import SimpleLayout from "./components/SimpleLayout";
import ScrollToTop from "./components/ScrollToTop";

function App() {
 
  return (
    <div className="bg-purple-50 selection:bg-purple-300 min-h-screen">
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          <Route element={<Main />}>
            <Route path="/" element={<Home />} />
            <Route path="/order" element={<Order />} />
          </Route>

          <Route element={<SimpleLayout />}>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/store" element={<Store />} />
            <Route path="/checkout" element={<Checkout />} />
          </Route>
        </Routes>
      </AuthProvider>
    </div>
  );
}
export default App;
