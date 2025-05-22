import { useState } from "react";
import RandomModal from "./RandomModal";

interface Document {
  id: number;
  name: string;
  type: string;
  date: string;
  size: string;
}

function Documents() {
  const [documents] = useState<Document[]>([
    { id: 1, name: "Report Q1", type: "PDF", date: "2024-01-15", size: "2.5 MB" },
    { id: 2, name: "Presentation", type: "PPTX", date: "2024-02-01", size: "5.1 MB" },
    { id: 3, name: "Budget", type: "XLSX", date: "2024-03-10", size: "1.2 MB" },
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <RandomModal />
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td className="px-6 py-4 whitespace-nowrap">{doc.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{doc.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{doc.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">{doc.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Documents;
