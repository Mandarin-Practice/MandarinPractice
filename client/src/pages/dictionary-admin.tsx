import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default function DictionaryAdmin() {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const { toast } = useToast();

  async function startImport() {
    if (isImporting) return;
    
    setIsImporting(true);
    setImportProgress(0);
    setImportLogs(['Starting comprehensive dictionary import...']);
    
    try {
      const response = await fetch('/api/admin/dictionary/import', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}: ${await response.text()}`);
      }
      
      // Set up SSE for progress updates
      const eventSource = new EventSource('/api/admin/dictionary/import-status');
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.log) {
          setImportLogs(prev => [...prev, data.log]);
        }
        
        if (data.progress !== undefined) {
          setImportProgress(data.progress);
        }
        
        if (data.completed) {
          eventSource.close();
          setIsImporting(false);
          toast({
            title: "Import Complete",
            description: `Added ${data.stats?.charactersAdded || 0} characters and ${data.stats?.definitionsAdded || 0} definitions.`,
          });
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        setIsImporting(false);
        setImportLogs(prev => [...prev, 'Error: Connection to server lost']);
        toast({
          title: "Import Error",
          description: "Lost connection to the server during import.",
          variant: "destructive",
        });
      };
    } catch (error: any) {
      setIsImporting(false);
      setImportLogs(prev => [...prev, `Error: ${error.message || 'Unknown error occurred'}`]);
      toast({
        title: "Import Failed",
        description: error.message || 'Unknown error occurred',
        variant: "destructive",
      });
    }
  }

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/characters/count');
      const data = await response.json();
      
      toast({
        title: "Dictionary Status",
        description: `Currently contains ${data.count} characters with definitions.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to check dictionary status.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dictionary Administration</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dictionary Import</CardTitle>
            <CardDescription>
              Import a comprehensive Chinese dictionary from CC-CEDICT and HanziDB sources.
              This will add over 100,000 Chinese characters and words with definitions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button 
                  onClick={startImport} 
                  disabled={isImporting}
                  className="flex-1"
                >
                  {isImporting ? "Importing..." : "Start Import"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={checkStatus}
                >
                  Check Status
                </Button>
              </div>
              
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Import Progress</span>
                    <span className="text-sm">{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              )}
              
              {importLogs.length > 0 && (
                <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Import Logs</AlertTitle>
                  <AlertDescription>
                    <div className="mt-2 max-h-80 overflow-y-auto rounded bg-muted p-2 font-mono text-xs">
                      {importLogs.map((log, i) => (
                        <div key={i} className="mb-1">
                          {log}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              This process may take several minutes. Please do not close this window.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}