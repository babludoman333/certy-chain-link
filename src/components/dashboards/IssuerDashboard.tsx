import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Award, Plus, LogOut, Shield, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSecureErrorMessage, logError } from "@/lib/errorHandler";
import { validateEmail, courseNameSchema } from "@/lib/inputValidation";

const IssuerDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    thisMonth: 0,
    revoked: 0
  });
  
  const [formData, setFormData] = useState({
    learnerEmail: "",
    courseName: "",
    issueDate: new Date().toISOString().split('T')[0]
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
          learner:learner_id(name, email)
        `)
        .eq('issuer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCertificates(data || []);
      
      // Calculate statistics
      const total = data?.length || 0;
      const active = data?.filter(c => c.status === 'active').length || 0;
      const revoked = data?.filter(c => c.status === 'revoked').length || 0;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const thisMonth = data?.filter(c => {
        const certDate = new Date(c.created_at);
        return certDate.getMonth() === currentMonth && certDate.getFullYear() === currentYear;
      }).length || 0;
      
      setStats({ total, active, thisMonth, revoked });
    } catch (error: any) {
      logError(error, "Fetch Certificates");
      // Silently fail, don't expose error to user
    }
  };

  const generateCryptoHash = async (data: string): Promise<string> => {
    // Use Web Crypto API for proper SHA-256 hashing
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate email input
      const emailValidation = validateEmail(formData.learnerEmail);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.error || "Invalid email");
      }

      // Validate course name
      courseNameSchema.parse(formData.courseName);

      // Find learner by email using parameterized query
      const { data: learnerProfile, error: learnerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailValidation.sanitized)
        .maybeSingle();

      if (learnerError) throw learnerError;
      
      if (!learnerProfile) {
        throw new Error("Learner account not found");
      }

      // Generate certificate data with proper cryptographic hash
      const certificateData = `${formData.courseName}-${emailValidation.sanitized}-${formData.issueDate}-${Date.now()}`;
      const hash = await generateCryptoHash(certificateData);
      const txnId = `TXN-${Date.now()}-${hash.substring(0, 6)}`;

      // Insert certificate
      const { error: certError } = await supabase
        .from('certificates')
        .insert({
          learner_id: learnerProfile.id,
          issuer_id: user?.id,
          course_name: formData.courseName,
          issue_date: formData.issueDate,
          certificate_hash: hash,
          txn_id: txnId,
          status: 'active'
        });

      if (certError) throw certError;

      toast({
        title: "Certificate Issued",
        description: "Certificate has been issued successfully",
      });

      setIsDialogOpen(false);
      setFormData({
        learnerEmail: "",
        courseName: "",
        issueDate: new Date().toISOString().split('T')[0]
      });
      fetchCertificates();
    } catch (error: any) {
      logError(error, "Issue Certificate");
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Issuer Dashboard</h1>
              <p className="text-sm text-muted-foreground">Issue & manage certificates</p>
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
          <Card className="border-l-4 border-l-primary hover-scale">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Issued</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.total}</h3>
                </div>
                <Award className="w-10 h-10 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary hover-scale">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.active}</h3>
                </div>
                <Shield className="w-10 h-10 text-secondary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent hover-scale">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.thisMonth}</h3>
                </div>
                <Plus className="w-10 h-10 text-accent/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive hover-scale">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revoked</p>
                  <h3 className="text-3xl font-bold mt-1">{stats.revoked}</h3>
                </div>
                <AlertCircle className="w-10 h-10 text-destructive/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">Certificates</h2>
            <p className="text-muted-foreground mt-1">Manage and issue new certificates</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Issue Certificate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue New Certificate</DialogTitle>
                <DialogDescription>
                  Create a blockchain-secured certificate for a learner
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="learnerEmail">Learner Email</Label>
                  <Input
                    id="learnerEmail"
                    type="email"
                    placeholder="learner@example.com"
                    value={formData.learnerEmail}
                    onChange={(e) => setFormData({ ...formData, learnerEmail: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="courseName">Course Name</Label>
                  <Input
                    id="courseName"
                    placeholder="Full Stack Development"
                    value={formData.courseName}
                    onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Issuing..." : "Issue Certificate"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Issued Certificates</CardTitle>
            <CardDescription>View all certificates you have issued</CardDescription>
          </CardHeader>
          <CardContent>
            {certificates.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No certificates issued yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {certificates.map((cert) => (
                    <TableRow key={cert.id}>
                      <TableCell className="font-medium">
                        {cert.learner?.name || 'Unknown'}
                      </TableCell>
                      <TableCell>{cert.course_name}</TableCell>
                      <TableCell>{new Date(cert.issue_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-xs">{cert.txn_id}</TableCell>
                      <TableCell>
                        <Badge variant={cert.status === 'active' ? 'default' : 'destructive'}>
                          {cert.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default IssuerDashboard;
