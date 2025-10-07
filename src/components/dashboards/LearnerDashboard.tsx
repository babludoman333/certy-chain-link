import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Award, Download, Share2, LogOut, Shield, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";

const LearnerDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string>("");

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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
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
      console.error('Error generating QR code:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
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
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Your Certificates</h2>
          <p className="text-muted-foreground mt-1">All your blockchain-verified achievements</p>
        </div>

        {certificates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No certificates yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Certificates issued to you will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <Card key={cert.id} className="hover:shadow-lg transition-shadow animate-fade-in">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Award className="w-8 h-8 text-primary" />
                    <Badge variant={cert.status === 'active' ? 'default' : 'destructive'}>
                      {cert.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-4">{cert.course_name}</CardTitle>
                  <CardDescription>
                    Issued by {cert.issuer?.name || 'Unknown'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {new Date(cert.issue_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction ID:</span>
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
              <div className="flex justify-center p-4 bg-muted rounded-lg">
                <img src={qrCode} alt="Certificate QR Code" className="w-48 h-48" />
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="font-mono text-xs">{selectedCert?.txn_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hash:</span>
                <span className="font-mono text-xs">{selectedCert?.certificate_hash}</span>
              </div>
              <div className="flex justify-between">
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
