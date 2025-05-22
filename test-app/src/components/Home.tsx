import { Link } from "react-router-dom";
import RandomModal from "./RandomModal";

function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <RandomModal />
      <h1 className="text-3xl font-bold mb-6">Welcome to the Test App</h1>
      <p className="mb-4">This is a simple test application with the following features:</p>
      <ul className="list-disc pl-6 mb-6">
        <li>Authentication</li>
        <li>Random popup modals</li>
        <li>Document management</li>
      </ul>
      <Link to="/documents" className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        View Documents
      </Link>
    </div>
  );
}

export default Home;
