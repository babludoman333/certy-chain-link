import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Award, Download, Share2, LogOut, Shield, QrCode, TrendingUp, Calendar, ArrowLeft } from "lucide-react";
import cert1 from "@/assets/certificates/certificate-template-1.jpg";
import cert2 from "@/assets/certificates/certificate-template-2.jpg";
import cert3 from "@/assets/certificates/certificate-template-3.jpg";
import { generateBlockchainData } from "@/lib/blockchainUtils";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { logError, getSecureErrorMessage } from "@/lib/errorHandler";

const LearnerDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>("");
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    recent: 0,
    revoked: 0
  });

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          issuer:issuer_id(name)
        `)
        .eq('learner_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
      
      // Calculate statistics
      const total = data?.length || 0;
      const active = data?.filter(c => c.status === 'active').length || 0;
      const revoked = data?.filter(c => c.status === 'revoked').length || 0;
      
      // Recent = last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recent = data?.filter(c => new Date(c.created_at) > thirtyDaysAgo).length || 0;
      
      setStats({ total, active, recent, revoked });
    } catch (error: any) {
      logError(error, "Fetch Certificates");
      toast({
        variant: "destructive",
        title: "Error",
        description: getSecureErrorMessage(error)
      });
    }
  };

  const handleViewCertificate = async (cert: any) => {
    setSelectedCert(cert);
    const qrData = JSON.stringify({
      hash: cert.certificate_hash,
      txnId: cert.txn_id,
      courseName: cert.course_name
    });
    
    try {
      const qr = await QRCode.toDataURL(qrData);
      setQrCode(qr);
    } catch (error) {
      logError(error, "Generate QR Code");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleDownloadCertificate = async (cert: any) => {
    try {
      // Get a mock certificate template
      const templates = [cert1, cert2, cert3];
      const templateIndex = Math.abs(cert.id.charCodeAt(0)) % templates.length;
      const certificateUrl = templates[templateIndex];
      
      // Fetch the image as a blob
      const response = await fetch(certificateUrl);
      const blob = await response.blob();
      
      // Create object URL from blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `certificate-${cert.course_name.replace(/\s+/g, '-')}-${cert.txn_id.substring(0, 8)}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      URL.revokeObjectURL(blobUrl);
      
      toast({
        title: "Downloaded",
        description: "Certificate downloaded successfully"
      });
    } catch (error) {
      logError(error, "Download Certificate");
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download certificate. Please try again."
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">My Certificates</h1>
              <p className="text-sm text-muted-foreground">View your achievements</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
          <Card className="border-l-4 border-l-secondary hover-scale">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Certificates</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.total}</h3>
                </div>
                <Award className="w-10 h-10 text-secondary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary hover-scale">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.active}</h3>
                </div>
                <Shield className="w-10 h-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent hover-scale">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Recent (30d)</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.recent}</h3>
                </div>
                <TrendingUp className="w-10 h-10 text-accent/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-muted hover-scale">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revoked</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.revoked}</h3>
                </div>
                <Calendar className="w-10 h-10 text-muted-foreground/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-bold">Your Certificates</h2>
          <p className="text-muted-foreground mt-1">All your blockchain-verified achievements</p>
        </div>

        {certificates.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="text-center py-12">
              <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No certificates yet</p>
              <p className="text-sm text-muted-foreground">
                Certificates issued to you will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert, index) => (
              <Card 
                key={cert.id} 
                className="hover:shadow-lg transition-all hover-scale border-2 hover:border-primary/50"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Award className="w-7 h-7 text-primary" />
                    </div>
                    <Badge variant={cert.status === 'active' ? 'default' : 'destructive'}>
                      {cert.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4 line-clamp-2">{cert.course_name}</CardTitle>
                  <CardDescription>
                    Issued by {cert.issuer?.name || 'Unknown'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {new Date(cert.issue_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">TXN ID:</span>
                      <span className="font-mono text-xs">{cert.txn_id.substring(0, 12)}...</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewCertificate(cert)}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      View QR
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadCertificate(cert)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      navigator.clipboard.writeText(cert.txn_id);
                      toast({ title: "Copied!", description: "Transaction ID copied to clipboard" });
                    }}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={!!selectedCert} onOpenChange={() => setSelectedCert(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCert?.course_name}</DialogTitle>
            <DialogDescription>Certificate Details & QR Code</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center p-6 bg-muted/50 rounded-lg border-2 border-dashed">
                <img src={qrCode} alt="Certificate QR Code" className="w-48 h-48" />
              </div>
            )}
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded">
                <p className="text-muted-foreground text-xs mb-1">Transaction ID:</p>
                <p className="font-mono text-xs break-all">{selectedCert?.txn_id}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <p className="text-muted-foreground text-xs mb-1">Certificate Hash:</p>
                <p className="font-mono text-xs break-all">{selectedCert?.certificate_hash}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <p className="text-muted-foreground text-xs mb-1">Blockchain Timestamp:</p>
                <p className="font-mono text-xs">{selectedCert && new Date(generateBlockchainData().timestamp).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <p className="text-muted-foreground text-xs mb-1">Issuer ID:</p>
                <p className="font-mono text-xs break-all">{selectedCert?.issuer_id}</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={selectedCert?.status === 'active' ? 'default' : 'destructive'}>
                  {selectedCert?.status}
                </Badge>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearnerDashboard;
