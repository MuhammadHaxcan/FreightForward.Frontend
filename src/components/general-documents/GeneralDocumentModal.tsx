import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateGeneralDocument } from "@/hooks/useGeneralDocuments";
import { fileApi } from "@/services/api";
import { Loader2 } from "lucide-react";

interface GeneralDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
}

export function GeneralDocumentModal({ open, onOpenChange, companyName }: GeneralDocumentModalProps) {
  const [documentName, setDocumentName] = useState("");
  const [remarks, setRemarks] = useState("");
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateGeneralDocument();
  const isLoading = createMutation.isPending || isUploading;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await fileApi.upload(file);
      setUploadedFilePath(result.fileName);
      setOriginalFileName(file.name);
    } catch {
      setUploadedFilePath(null);
      setOriginalFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const cleanup = () => {
    setDocumentName("");
    setRemarks("");
    setUploadedFilePath(null);
    setOriginalFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = (openState: boolean) => {
    if (!openState && uploadedFilePath && !createMutation.isSuccess) {
      fileApi.delete(uploadedFilePath).catch(() => {});
    }
    if (!openState) {
      cleanup();
    }
    onOpenChange(openState);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate(
      {
        documentName,
        filePath: uploadedFilePath || undefined,
        originalFileName: originalFileName || undefined,
        remarks: remarks || undefined,
      },
      {
        onSuccess: () => {
          cleanup();
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-card p-0">
        <DialogHeader className="bg-modal-header text-white p-4 rounded-t-lg">
          <DialogTitle className="text-white text-lg font-semibold">
            Add New General Document
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label className="form-label">Branch</Label>
            <Input
              value={companyName}
              className="form-input bg-muted"
              readOnly
            />
          </div>
          <div>
            <Label className="form-label">Document Name *</Label>
            <Input
              placeholder="Document Name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div>
            <Label className="form-label">General Document</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/gif,image/png,image/jpg,image/jpeg"
              onChange={handleFileChange}
              className="form-input"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Upload files only: gif, png, jpg, jpeg
            </p>
            {originalFileName && (
              <p className="text-xs text-primary mt-1">{originalFileName}</p>
            )}
          </div>
          <div>
            <Label className="form-label">Remarks</Label>
            <textarea
              placeholder="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="btn-success px-8" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
