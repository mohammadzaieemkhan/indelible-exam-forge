
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <footer className="py-4 md:py-6 border-t border-border">
        <div className="container mx-auto px-4 text-center text-xs md:text-sm text-muted-foreground">
          © {new Date().getFullYear()} Indelible AI. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
