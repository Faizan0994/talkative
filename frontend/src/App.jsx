import "./App.css";
import WelcomeScreen from "./pages/welcome";
import SignIn from "./pages/signIn";
import { Routes, Route } from "react-router";

function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="signin" element={<SignIn />} />
    </Routes>
  );
}

export default App;
