import { Button } from "@/components/ui/button";

interface FormCardProps {
  table: any;
  onOpenForm: (table: any) => void;
  onViewData: (tableId: string) => void;
  onDelete: (table: any) => void;
}

export function FormCard({
  table,
  onOpenForm,
  onViewData,
  onDelete,
}: FormCardProps) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            {table.display_name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {table.fields.length} fields • Created{" "}
            {new Date(table.created_at).toLocaleDateString()}
          </p>
        </div>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(table);
          }}
          variant="destructive"
          size="sm"
          className="h-9 px-3 text-xs font-medium hover:bg-red-700 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            ></path>
          </svg>
          Delete
        </Button>
      </div>

      <div className="space-y-2 mb-4 bg-gray-50 p-3 rounded-md">
        <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Form Fields:
        </h4>
        {table.fields.slice(0, 4).map((field: any) => (
          <div key={field.name} className="flex justify-between text-sm">
            <span className="text-gray-600 truncate flex-1">{field.name}</span>
            <span className="text-gray-800 font-medium ml-2 bg-white px-2 py-1 rounded text-xs">
              {field.type}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </div>
        ))}
        {table.fields.length > 4 && (
          <div className="text-xs text-gray-500 text-center pt-1 border-t border-gray-200">
            + {table.fields.length - 4} more fields
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onOpenForm(table);
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 transition-colors flex items-center justify-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            ></path>
          </svg>
          Open Form
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onViewData(table.id);
          }}
          variant="outline"
          className="px-4 border-gray-300 hover:bg-gray-50 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            ></path>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            ></path>
          </svg>
          View Data
        </Button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          Click "Open in New Tab" to fill out this form securely
        </p>
      </div>
    </div>
  );
}
