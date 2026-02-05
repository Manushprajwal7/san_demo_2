import { FormGenerator } from "@/components/form-generator";

export default function FormGeneratorPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Form Generator</h1>
        <p className="text-muted-foreground mt-2">
          Select an employee and generate a filled Form_A.docx with [[placeholders]] replaced by database data.
        </p>
      </div>
      <FormGenerator />
    </div>
  );
}
