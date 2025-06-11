import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Home from "../pages/Home";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
        // Here will be other routes
    ],
  },
]);