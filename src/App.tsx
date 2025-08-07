import { useState, lazy , Suspense } from "react";
import SignUp from "./components/SignUp";
import { Route, Routes, Navigate } from "react-router-dom";
import LogIn from "./pages/LogIn.tsx";

const DashboardLayout = lazy(() => import ("./components/DashboardLayout.tsx"))

function App() {
  const isAuthenticated = !!localStorage.getItem("authToken");
  const [registeredUser, setRegisteredUser] = useState<string | null>(null);

  return (
    <Suspense fallback={<div>loading dashboard...</div>}>
      <Routes>
        <Route
          path="/"
          element={<SignUp setRegisteredUser={setRegisteredUser} />}
        />
        <Route
          path="/login"
          element={<LogIn registeredUser={registeredUser} />}
        />

        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/dashboard/:otherUserId?"
          element={
            isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/chatRoom/:otherUserId"
          element={<Navigate to="/dashboard/:otherUserId" replace />}
        />
        <Route
          path="/chatRoom"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route path="*" element={<Navigate to="/Login" />} />
      </Routes>
    </Suspense>
  );
}

export default App;
