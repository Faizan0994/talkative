import "./App.css";
import WelcomeScreen from "./pages/welcome";
import SignIn from "./pages/signIn";
import SignUp from "./pages/signUp";
import Dashboard from "./pages/dashboard";
import { Routes, Route } from "react-router";
import useVisualViewportHeight from "./hooks/useVisualViewportHeight";

function App() {
  useVisualViewportHeight();

  return (
    <Routes>
      <Route path="/" element={<WelcomeScreen />} />
      <Route path="signin" element={<SignIn />} />
      <Route path="signup" element={<SignUp />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="dashboard/:chatId" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
