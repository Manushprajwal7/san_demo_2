"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { FileText, Upload, Download, Loader2 } from "lucide-react";

const MAX_FILE_SIZE_MB = 25;
const ALLOWED_EXTENSIONS = [".docx", ".doc"];
const ACCEPT = ".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword";

type Status = "idle" | "uploading" | "converting" | "success" | "error";

export function DocxToPdfConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setStatus("idle");
    setError(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [pdfBlobUrl]);

  const validateFile = (f: File): string | null => {
    const ext = "." + (f.name.split(".").pop() || "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return "Only .docx or .doc files are allowed.";
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File must be under ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    reset();
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      toast.error(err);
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    reset();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      toast.error(err);
      setError(err);
      return;
    }
    setFile(f);
    setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleConvert = async () => {
    if (!file) return;
    setStatus("uploading");
    setError(null);
    setPdfBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      setStatus("converting");
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/convert-docx-to-pdf", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") || "";

      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || res.statusText);
        }
        throw new Error(res.statusText || "Conversion failed");
      }

      if (!contentType.includes("application/pdf")) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data?.error || "Server did not return a PDF.");
        } catch {
          throw new Error("Server did not return a PDF.");
        }
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setStatus("success");
      toast.success("Conversion complete. Click Download PDF.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Conversion failed";
      setError(message);
      setStatus("error");
      toast.error(message);
    }
  };

  const handleDownload = () => {
    if (!pdfBlobUrl || !file) return;
    const base = file.name.replace(/\.[^.]+$/, "");
    const a = document.createElement("a");
    a.href = pdfBlobUrl;
    a.download = `${base}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Download started.");
  };

  const isBusy = status === "uploading" || status === "converting";

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          DOCX to PDF Converter
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Upload a .docx or .doc file and convert it to PDF. Max {MAX_FILE_SIZE_MB}MB. Requires LibreOffice on the server.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>File</Label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
              ${file ? "bg-muted/30" : ""}
            `}
          >
            <input
              type="file"
              accept={ACCEPT}
              onChange={handleFileChange}
              className="hidden"
              id="docx-upload"
            />
            <label htmlFor="docx-upload" className="cursor-pointer block">
              {file ? (
                <p className="text-sm font-medium text-foreground">{file.name}</p>
              ) : (
                <>
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag and drop or click to select a .docx file
                  </p>
                </>
              )}
            </label>
          </div>
        </div>

        {(status === "uploading" || status === "converting") && (
          <div className="space-y-2">
            <Progress value={status === "uploading" ? 50 : 90} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {status === "uploading" ? "Uploading…" : "Converting to PDF…"}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleConvert}
            disabled={!file || isBusy}
          >
            {isBusy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Converting…
              </>
            ) : (
              "Convert to PDF"
            )}
          </Button>
          {status === "success" && pdfBlobUrl && (
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          )}
          {(status === "success" || status === "error") && (
            <Button variant="ghost" onClick={reset}>
              New file
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
