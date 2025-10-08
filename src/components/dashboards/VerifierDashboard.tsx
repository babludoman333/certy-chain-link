import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, CheckCircle2, XCircle, AlertCircle, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSecureErrorMessage, logError } from "@/lib/errorHandler";
import { validateCertificateSearch } from "@/lib/inputValidation";

const VerifierDashboard = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleVerify = async () => {
    if (!searchInput.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a search query"
      });
      return;
    }

    // Validate input
    const validation = validateCertificateSearch(searchInput);
    if (!validation.isValid) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: validation.error || "Invalid search query"
      });
      return;
    }

    setLoading(true);
    setVerificationResult(null);

    try {
      const sanitizedInput = validation.sanitized;
      
      // Use parameterized queries instead of string interpolation
      // Search by txn_id
      let { data: certByTxn } = await supabase
        .from('certificates')
        .select(`
          *,
          learner:learner_id(name, email),
          issuer:issuer_id(name)
        `)
        .eq('txn_id', sanitizedInput)
        .maybeSingle();

      // If not found by txn_id, search by hash
      if (!certByTxn) {
        const { data: certByHash } = await supabase
          .from('certificates')
          .select(`
            *,
            learner:learner_id(name, email),
            issuer:issuer_id(name)
          `)
          .eq('certificate_hash', sanitizedInput.toLowerCase())
          .maybeSingle();
        
        certByTxn = certByHash;
      }

      if (!certByTxn) {
        setVerificationResult({
          status: 'invalid',
          message: 'Certificate not found'
        });
        
        // Log verification attempt (null certificate_id for invalid)
        await supabase.from('verifications').insert({
          certificate_id: null,
          verification_status: 'invalid'
        });
      } else {
        const status = certByTxn.status === 'active' ? 'authentic' : 'revoked';
        setVerificationResult({
          status,
          certificate: certByTxn,
          message: status === 'authentic' 
            ? 'Certificate is authentic and verified'
            : 'Certificate has been revoked'
        });

        // Log verification
        await supabase.from('verifications').insert({
          certificate_id: certByTxn.id,
          verification_status: status
        });
      }
    } catch (error: any) {
      logError(error, "Certificate Verification");
      toast({
        variant: "destructive",
        title: "Error",
        description: getSecureErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getStatusIcon = () => {
    if (!verificationResult) return null;
    
    switch (verificationResult.status) {
      case 'authentic':
        return <CheckCircle2 className="w-16 h-16 text-secondary" />;
      case 'revoked':
        return <AlertCircle className="w-16 h-16 text-accent" />;
      case 'invalid':
        return <XCircle className="w-16 h-16 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    if (!verificationResult) return '';
    
    switch (verificationResult.status) {
      case 'authentic':
        return 'border-secondary bg-secondary/5';
      case 'revoked':
        return 'border-accent bg-accent/5';
      case 'invalid':
        return 'border-destructive bg-destructive/5';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-primary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Verifier Dashboard</h1>
              <p className="text-sm text-muted-foreground">Verify certificate authenticity</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Certificate Verification</h2>
          <p className="text-muted-foreground">
            Verify certificate authenticity using blockchain verification
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Verify Certificate</CardTitle>
            <CardDescription>
              Enter the transaction ID or certificate hash to verify
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Transaction ID or Hash</Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    placeholder="Enter TXN ID or certificate hash..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                  />
                  <Button onClick={handleVerify} disabled={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {verificationResult && (
          <Card className={`animate-scale-in border-2 ${getStatusColor()}`}>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                {getStatusIcon()}
                <h3 className="text-2xl font-bold mt-4 mb-2">
                  {verificationResult.status === 'authentic' && 'Certificate Verified'}
                  {verificationResult.status === 'revoked' && 'Certificate Revoked'}
                  {verificationResult.status === 'invalid' && 'Invalid Certificate'}
                </h3>
                <p className="text-muted-foreground">{verificationResult.message}</p>
              </div>

              {verificationResult.certificate && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-3">Certificate Details</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Course</p>
                          <p className="font-medium">{verificationResult.certificate.course_name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Learner</p>
                          <p className="font-medium">{verificationResult.certificate.learner?.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Issued By</p>
                          <p className="font-medium">{verificationResult.certificate.issuer?.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Issue Date</p>
                          <p className="font-medium">
                            {new Date(verificationResult.certificate.issue_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Transaction ID</p>
                          <p className="font-mono text-xs break-all">
                            {verificationResult.certificate.txn_id}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Certificate Hash</p>
                          <p className="font-mono text-xs break-all">
                            {verificationResult.certificate.certificate_hash}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default VerifierDashboard;
