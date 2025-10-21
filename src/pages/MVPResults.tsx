import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Download, 
  Edit3, 
  Save, 
  FileText, 
  Printer,
  Copy,
  Brain
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';
import type { MVPDocument } from '@/hooks/useVideoUpload';

const MVPResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  
  // Get MVP document from router state
  const mvpDocument: MVPDocument | null = location.state?.mvpDocument;

  useEffect(() => {
    if (!mvpDocument) {
      // If no document in state, redirect back to home
      navigate('/');
      return;
    }
    
    setOriginalContent(mvpDocument.content);
    setEditedContent(mvpDocument.content);
  }, [mvpDocument, navigate]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setOriginalContent(editedContent);
    setIsEditing(false);
    toast({
      title: "Document Updated",
      description: "Your changes have been saved.",
    });
  };

  const handleCancel = () => {
    setEditedContent(originalContent);
    setIsEditing(false);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      toast({
        title: "Copied to Clipboard",
        description: "MVP document copied to clipboard.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
      });
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([editedContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mvp-document-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: "MVP document downloaded as Markdown file.",
    });
  };

  const handlePrintPDF = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>MVP Document</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
              line-height: 1.6;
            }
            h1, h2, h3 { color: #333; }
            h2 { border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
            pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
            blockquote { border-left: 4px solid #e2e8f0; padding-left: 15px; margin-left: 0; color: #666; }
            @media print { body { margin: 0; padding: 15px; } }
          </style>
        </head>
        <body>
          <div id="content"></div>
          <script>
            // Convert markdown to HTML (basic conversion)
            const markdown = ${JSON.stringify(editedContent)};
            const html = markdown
              .replace(/^# (.*$)/gim, '<h1>$1</h1>')
              .replace(/^## (.*$)/gim, '<h2>$1</h2>')
              .replace(/^### (.*$)/gim, '<h3>$1</h3>')
              .replace(/^\\*\\* (.*?) \\*\\*/gim, '<strong>$1</strong>')
              .replace(/^\\* (.*$)/gim, '<li>$1</li>')
              .replace(/\\n\\n/g, '</p><p>')
              .replace(/\\n/g, '<br>');
            document.getElementById('content').innerHTML = '<p>' + html + '</p>';
            
            // Auto-print when loaded
            window.onload = () => {
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (!mvpDocument) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">MVP Document</h1>
              <p className="text-muted-foreground">
                Generated on {new Date(mvpDocument.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleDownloadMarkdown}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePrintPDF}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button onClick={handleCopyToClipboard} variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </>
            )}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Startup MVP Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[600px] font-mono text-sm"
                placeholder="Edit your MVP document..."
              />
            ) : (
              <div className="prose prose-gray max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {editedContent}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MVPResults;