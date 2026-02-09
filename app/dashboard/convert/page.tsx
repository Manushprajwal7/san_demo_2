import { DashboardHeader } from "@/components/dashboard-header";
import { DocxToPdfConverter } from "@/components/docx-to-pdf-converter";

export default function ConvertPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">DOCX to PDF</h1>
            <p className="text-muted-foreground mt-1">
              Upload a Word document and convert it to PDF. Requires LibreOffice on the server.
            </p>
          </div>
          <DocxToPdfConverter />
        </div>
      </main>
    </div>
  );
}
