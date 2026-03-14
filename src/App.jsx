import { Routes, Route } from "react-router-dom";
import SignUp from "./components/SignUp";
import SignIn from "./components/SignIn";
import Home from "./components/Home";
import Main from "./components/Main";
import Order from "./components/Order";
import Store from "./components/Store";
import Cart from "./components/Cart";
import SimpleLayout from "./components/SimpleLayout";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute"; // We'll create this below

function App() {
  return (
    <div className="bg-purple-50 selection:bg-purple-300 min-h-screen">
      <ScrollToTop />
      <Routes>
        {/* PUBLIC ROUTES: Users can browse these freely */}
        <Route element={<Main />}>
          <Route path="/" element={<Home />} />
          <Route path="/store" element={<Store />} />
        </Route>

        <Route element={<SimpleLayout />}>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
        </Route>

        {/* SEMI-PROTECTED: Anyone can add to cart, but we protect the checkout */}
        <Route element={<Main />}>
          <Route path="/order" element={<Order />} />

          {/* PROTECTED ROUTES: Only logged-in users can access these */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </div>
  );
}
export default App;
