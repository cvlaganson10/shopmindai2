import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  X,
  Trash2,
  RefreshCw,
  CloudUpload,
  File,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".csv", ".xlsx", ".xls"];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

const statusConfig: Record<string, { color: string; label: string; animate?: boolean }> = {
  pending: { color: "bg-muted text-muted-foreground", label: "Pending" },
  extracting: { color: "bg-primary/20 text-primary", label: "Extracting", animate: true },
  chunking: { color: "bg-primary/20 text-primary", label: "Chunking", animate: true },
  embedding: { color: "bg-accent/20 text-accent", label: "Embedding", animate: true },
  complete: { color: "bg-success/20 text-success", label: "Complete" },
  failed: { color: "bg-destructive/20 text-destructive", label: "Failed" },
};

const UploadPage = () => {
  const { store } = useStore();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [gdocUrl, setGdocUrl] = useState("");

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_documents")
        .select("*")
        .eq("store_id", store!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!store,
    refetchInterval: (query) => {
      const docs = query.state.data;
      const hasProcessing = docs?.some((d) =>
        ["pending", "extracting", "chunking", "embedding"].includes(d.status || "")
      );
      return hasProcessing ? 5000 : false;
    },
  });

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext) && !ACCEPTED_TYPES.includes(file.type)) {
      return `${file.name}: Unsupported file type`;
    }
    if (file.size > MAX_SIZE) return `${file.name}: File too large (max 25MB)`;
    return null;
  };

  const addFiles = (files: FileList | File[]) => {
    const newFiles: File[] = [];
    for (const file of Array.from(files)) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
      } else if (!stagedFiles.some((f) => f.name === file.name)) {
        newFiles.push(file);
      }
    }
    setStagedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [stagedFiles]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!store || !user) throw new Error("Missing store or user");
      for (const file of stagedFiles) {
        const storagePath = `${store.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, file);
        if (uploadError) throw uploadError;

        const { error: insertError } = await supabase.from("knowledge_documents").insert({
          store_id: store.id,
          file_name: file.name,
          file_type: file.name.split(".").pop()?.toLowerCase() || "unknown",
          file_size_bytes: file.size,
          storage_path: storagePath,
          uploaded_by: user.id,
          status: "pending",
        });
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      setStagedFiles([]);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Documents uploaded successfully!");
      toast.info("Processing your documents... this takes 2-3 minutes");
    },
    onError: (err: any) => {
      toast.error(err.message || "Upload failed");
    },
  });

  const importGdoc = async () => {
    if (!gdocUrl.trim() || !store || !user) return;
    const { error } = await supabase.from("knowledge_documents").insert({
      store_id: store.id,
      file_name: gdocUrl,
      file_type: "gdoc",
      storage_path: gdocUrl,
      uploaded_by: user.id,
      status: "pending",
    });
    if (error) {
      toast.error("Failed to import Google Doc");
    } else {
      setGdocUrl("");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Google Doc added!");
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase.from("knowledge_documents").delete().eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
  });

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!store) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Please create a store first from the Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Knowledge Base</h2>
        <p className="text-muted-foreground mt-1">Upload your product catalog and store documents</p>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.accept = ACCEPTED_EXTENSIONS.join(",");
          input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) addFiles(files);
          };
          input.click();
        }}
      >
        <CloudUpload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-foreground font-medium mb-1">Drag files here or click to browse</p>
        <p className="text-sm text-muted-foreground">Max 25MB per file</p>
        <div className="flex gap-2 justify-center mt-3">
          {["PDF", "DOCX", "CSV", "XLSX"].map((t) => (
            <span key={t} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
      </div>

      {/* Google Docs import */}
      <div className="flex gap-2">
        <Input
          placeholder="Paste a Google Docs URL..."
          value={gdocUrl}
          onChange={(e) => setGdocUrl(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" onClick={importGdoc} disabled={!gdocUrl.trim()} className="rounded-full">
          Import from Google Docs
        </Button>
      </div>

      {/* Staged files */}
      {stagedFiles.length > 0 && (
        <div className="glass-card rounded-xl p-4 space-y-3">
          <h3 className="font-heading text-sm font-semibold text-foreground">Files to upload ({stagedFiles.length})</h3>
          {stagedFiles.map((file) => (
            <div key={file.name} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2 min-w-0">
                <File className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setStagedFiles((prev) => prev.filter((f) => f.name !== file.name))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            onClick={() => uploadMutation.mutate()}
            disabled={uploadMutation.isPending}
            className="w-full rounded-full"
          >
            {uploadMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Process All Documents</>
            )}
          </Button>
        </div>
      )}

      {/* Documents list */}
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Uploaded Documents</h3>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="glass-card rounded-xl p-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No documents yet</p>
            <p className="text-sm text-muted-foreground">Upload your first product catalog to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const status = statusConfig[doc.status || "pending"] || statusConfig.pending;
              return (
                <div key={doc.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">{doc.file_type?.toUpperCase()}</span>
                          <span className="text-xs text-muted-foreground">{formatSize(doc.file_size_bytes)}</span>
                          {doc.chunk_count > 0 && <span className="text-xs text-muted-foreground">{doc.chunk_count} chunks</span>}
                          {doc.created_at && (
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color} ${status.animate ? "animate-pulse" : ""}`}>
                        {status.label}
                      </span>
                      {doc.status === "failed" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Re-process">
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{doc.file_name}" and all its chunks.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(doc.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  {status.animate && doc.progress != null && doc.progress > 0 && (
                    <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${doc.progress}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
