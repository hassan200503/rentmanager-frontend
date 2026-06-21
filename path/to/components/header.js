import { Button, Header, Form } from "@/components";

export const Header = () => (
  <header className="flex justify-between items-center p-4">
    <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
    <nav>
      <Link className="text-gray-600 hover:text-primary">Profile</Link>
      <Link className="text-gray-600 hover:text-primary">Settings</Link>
    </nav>
  </header>
);
