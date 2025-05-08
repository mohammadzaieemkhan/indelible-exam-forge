
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { ThemeProvider } from "./ThemeProvider";

const Layout = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="indelible-theme">
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Outlet />
        </main>
        <footer className="py-6 border-t border-border">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Indelible AI. All rights reserved.
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default Layout;
