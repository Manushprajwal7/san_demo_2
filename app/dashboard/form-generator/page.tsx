import { FormGenerator } from "@/components/form-generator";

export default function FormGeneratorPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Form Generator</h1>
        <p className="text-muted-foreground mt-2">
          Generate populated Word documents from templates using employee data
        </p>
      </div>
      <FormGenerator />
    </div>
  );
}
