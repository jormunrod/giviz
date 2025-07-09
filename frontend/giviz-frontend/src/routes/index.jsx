import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Home from "../pages/Home";
import Analysis from "../pages/Analysis";
import Contributor from "../pages/Contributor";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "analysis",
        element: <Analysis />,
      },
      {
        path: "contributor/:username",
        element: <Contributor />,
      },
    ],
  },
]);
