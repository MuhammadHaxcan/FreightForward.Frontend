import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DateInput } from "@/components/ui/date-input";
import { getTodayDateOnly } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settingsApi, DocumentType } from "@/services/api/settings";
import { fileApi, AddShipmentDocumentRequest, FileUploadResponse } from "@/services/api/shipment";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";

interface DocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (document: AddShipmentDocumentRequest) => Promise<void>;
}

export function DocumentModal({ open, onOpenChange, onSave }: DocumentModalProps) {
  const { toast } = useToast();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    documentTypeId: null as number | null,
    documentNo: "",
    docDate: getTodayDateOnly(),
    remarks: "",
    file: null as File | null,
    uploadedFileName: "",
    originalFileName: "",
  });

  // Load document types when modal opens
  useEffect(() => {
    if (open) {
      loadDocumentTypes();
      // Reset form when opening
      setFormData({
        documentTypeId: null,
        documentNo: "",
        docDate: getTodayDateOnly(),
        remarks: "",
        file: null,
        uploadedFileName: "",
        originalFileName: "",
      });
    }
  }, [open]);

  const loadDocumentTypes = async () => {
    try {
      const response = await settingsApi.getAllDocumentTypes();
      if (response.data) {
        setDocumentTypes(response.data);
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error("Failed to load document types:", error);
      toast({
        title: "Error",
        description: "Failed to load document types",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, file }));

      // Upload file immediately
      setUploading(true);
      try {
        const result: FileUploadResponse = await fileApi.upload(file);
        setFormData(prev => ({
          ...prev,
          uploadedFileName: result.fileName,
          originalFileName: result.originalFileName,
        }));
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } catch (error) {
        console.error("File upload failed:", error);
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        });
        setFormData(prev => ({ ...prev, file: null }));
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveFile = async () => {
    if (formData.uploadedFileName) {
      try {
        await fileApi.delete(formData.uploadedFileName);
      } catch (error) {
        console.error("Failed to delete file:", error);
      }
    }
    setFormData(prev => ({
      ...prev,
      file: null,
      uploadedFileName: "",
      originalFileName: "",
    }));
  };

  const handleSave = async () => {
    if (!formData.documentNo.trim()) {
      toast({
        title: "Validation Error",
        description: "Document No is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const documentData: AddShipmentDocumentRequest = {
        documentTypeId: formData.documentTypeId,
        documentNo: formData.documentNo,
        docDate: formData.docDate,
        filePath: formData.uploadedFileName || undefined,
        originalFileName: formData.originalFileName || undefined,
        remarks: formData.remarks || undefined,
      };

      await onSave(documentData);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save document:", error);
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    // If file was uploaded but not saved, delete it
    if (formData.uploadedFileName) {
      try {
        await fileApi.delete(formData.uploadedFileName);
      } catch (error) {
        console.error("Failed to cleanup file:", error);
      }
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg bg-card border border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg bg-[#2c3e50] text-white p-4 -m-6 mb-0 rounded-t-lg">
            Add Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-6">
          {/* Row 1 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-sm">Document Type</Label>
              <Select
                value={formData.documentTypeId?.toString() || ""}
                onValueChange={(v) => handleInputChange("documentTypeId", v ? parseInt(v) : null)}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border">
                  {documentTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Document No <span className="text-red-500">*</span></Label>
              <Input
                value={formData.documentNo}
                onChange={(e) => handleInputChange("documentNo", e.target.value)}
                placeholder="Document No"
                className="bg-background border-border"
              />
            </div>
            <div>
              <Label className="text-sm">Doc. Date</Label>
              <DateInput
                value={formData.docDate}
                onChange={(v) => handleInputChange("docDate", v)}
              />
            </div>
          </div>

          {/* Add Files Button */}
          <div>
            <Label className="text-sm">Attachment</Label>
            <div className="flex items-center gap-2 mt-1">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Button
                  type="button"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "+Add Files"
                  )}
                </Button>
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="hidden"
              />
              {formData.file && (
                <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded">
                  <span className="text-sm text-foreground">{formData.file.name}</span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <Label className="text-sm">Remarks</Label>
            <Textarea
              value={formData.remarks}
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              placeholder="Remarks"
              className="bg-background border-border min-h-[100px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="bg-[#34495e] hover:bg-[#4a5568] text-white border-[#4a5568] px-8"
              disabled={loading}
            >
              Close
            </Button>
            <Button
              onClick={handleSave}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-8"
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
