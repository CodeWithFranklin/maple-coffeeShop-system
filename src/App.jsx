import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import LoadingScreen from "./components/LoadingScreen";
import { Routes, Route } from "react-router-dom";
import Store from "./components/Store";
import Cart from "./components/Cart";
import Home from "./components/Home";
import Main from "./components/Main";
import SimpleLayout from "./components/SimpleLayout";
import ScrollToTop from "./components/ScrollToTop";

// App.jsx
function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // This listener is the heart of your app's mount-check
    const unsubscribe = onAuthStateChanged(auth, () => {
      // Once this runs once, we know Firebase is ready and JSX can mount
      setIsInitializing(false);
    });

    return () => unsubscribe();
  }, []);

  // GLOBAL LOADER: Nothing renders until initialization is done
  if (isInitializing) {
    return <LoadingScreen />;
  }
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
