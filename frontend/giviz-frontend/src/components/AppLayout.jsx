import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-givizBackground text-givizBlack">
      <Navbar />
      <main className="flex-grow pt-24 px-4">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}