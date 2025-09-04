import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ChatPage from "./pages/ChatPage";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <ChatPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
]);


function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
