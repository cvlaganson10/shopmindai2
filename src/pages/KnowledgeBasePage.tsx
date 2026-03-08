import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/hooks/useStore";
import { useRealtime } from "@/hooks/useRealtime";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
    Database, FileText, AlertTriangle, CheckCircle, Loader2,
    RefreshCw, Trash2, Eye, ChevronRight,
} from "lucide-react";

const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
    pending: { color: "bg-muted text-muted-foreground", label: "Pending", icon: Loader2 },
    extracting: { color: "bg-blue-500/20 text-blue-400", label: "Extracting", icon: Loader2 },
    chunking: { color: "bg-purple-500/20 text-purple-400", label: "Chunking", icon: Loader2 },
    embedding: { color: "bg-indigo-500/20 text-indigo-400", label: "Embedding", icon: Loader2 },
    complete: { color: "bg-green-500/20 text-green-400", label: "Complete", icon: CheckCircle },
    failed: { color: "bg-destructive/20 text-destructive", label: "Failed", icon: AlertTriangle },
    partial: { color: "bg-yellow-500/20 text-yellow-400", label: "Partial", icon: AlertTriangle },
};

const KnowledgeBasePage = () => {
    const { store } = useStore();
    const queryClient = useQueryClient();
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

    // Subscribe to realtime document status updates
    useRealtime({
        table: "knowledge_documents",
        storeId: store?.id || "",
        enabled: !!store?.id,
    });

    // Fetch documents
    const { data: documents, isLoading } = useQuery({
        queryKey: ["knowledge-documents", store?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("knowledge_documents")
                .select("*")
                .eq("store_id", store!.id)
                .eq("is_active", true)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!store?.id,
    });

    // Fetch chunks for selected document
    const { data: chunks } = useQuery({
        queryKey: ["knowledge-chunks", selectedDoc],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("knowledge_chunks")
                .select("id, content, metadata, chunk_index")
                .eq("document_id", selectedDoc!)
                .eq("is_active", true)
                .order("chunk_index", { ascending: true })
                .limit(20);
            if (error) throw error;
            return data;
        },
        enabled: !!selectedDoc,
    });

    // Delete document mutation
    const deleteMutation = useMutation({
        mutationFn: async (docId: string) => {
            await supabase.from("knowledge_chunks").delete().eq("document_id", docId);
            await supabase.from("knowledge_documents").update({ is_active: false }).eq("id", docId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
            toast.success("Document deleted");
            setSelectedDoc(null);
        },
    });

    const totalChunks = documents?.reduce((sum, d) => sum + (d.chunk_count || 0), 0) || 0;
    const processedCount = documents?.filter((d) => d.status === "complete").length || 0;
    const failedCount = documents?.filter((d) => d.status === "failed").length || 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-heading font-bold">Knowledge Base</h1>
                <p className="text-muted-foreground">View and manage your AI's knowledge sources</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                            <div>
                                <p className="text-2xl font-bold">{documents?.length || 0}</p>
                                <p className="text-xs text-muted-foreground">Total Files</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="h-5 w-5 text-green-400" /></div>
                            <div>
                                <p className="text-2xl font-bold">{processedCount}</p>
                                <p className="text-xs text-muted-foreground">Processed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10"><Database className="h-5 w-5 text-indigo-400" /></div>
                            <div>
                                <p className="text-2xl font-bold">{totalChunks}</p>
                                <p className="text-xs text-muted-foreground">Chunks Indexed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
                            <div>
                                <p className="text-2xl font-bold">{failedCount}</p>
                                <p className="text-xs text-muted-foreground">Failed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Document list */}
                <Card className="lg:col-span-2 bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-heading">Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : documents?.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                No documents uploaded yet. Go to Upload to add your first file.
                            </p>
                        ) : (
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-2">
                                    {documents?.map((doc) => {
                                        const status = statusConfig[doc.status || "pending"] || statusConfig.pending;
                                        const StatusIcon = status.icon;
                                        return (
                                            <div
                                                key={doc.id}
                                                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/5 ${selectedDoc === doc.id ? "border-primary bg-primary/5" : "border-border"
                                                    }`}
                                                onClick={() => setSelectedDoc(doc.id)}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{doc.file_name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {doc.chunk_count || 0} chunks · {doc.file_type?.toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge variant="secondary" className={`text-xs ${status.color}`}>
                                                        <StatusIcon className={`h-3 w-3 mr-1 ${doc.status?.includes("ing") ? "animate-spin" : ""}`} />
                                                        {status.label}
                                                    </Badge>
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>

                {/* Chunk preview panel */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-heading">Chunk Preview</CardTitle>
                            {selectedDoc && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => deleteMutation.mutate(selectedDoc)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!selectedDoc ? (
                            <p className="text-muted-foreground text-sm text-center py-8">
                                Select a document to preview its chunks
                            </p>
                        ) : !chunks?.length ? (
                            <p className="text-muted-foreground text-sm text-center py-8">
                                No chunks available for this document
                            </p>
                        ) : (
                            <ScrollArea className="h-[400px]">
                                <div className="space-y-3">
                                    {chunks.map((chunk, i) => (
                                        <div key={chunk.id} className="p-3 rounded-md bg-muted/50 border border-border">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    Chunk #{chunk.chunk_index ?? i + 1}
                                                </span>
                                                {chunk.metadata?.doc_type && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {String(chunk.metadata.doc_type)}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-foreground/80 line-clamp-4">{chunk.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default KnowledgeBasePage;
