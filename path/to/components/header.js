import { Button, Header, Form } from "@/components";

export const Header = () => (
  <header className="header">
    <div className="flex justify-between items-center">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <nav className="flex gap-2">
        <Link className="nav-link" href="/profile">Profile</Link>
        <Link className="nav-link" href="/settings">Settings</Link>
      </nav>
    </div>
  </header>
);
