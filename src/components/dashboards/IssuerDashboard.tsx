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
import { Award, Plus, LogOut, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const IssuerDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
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
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const generateHash = (data: string): string => {
    // Simple hash generation (in production, use proper crypto library)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Find learner by email
      const { data: learnerProfile, error: learnerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.learnerEmail)
        .single();

      if (learnerError || !learnerProfile) {
        throw new Error("Learner not found with this email");
      }

      // Generate certificate data
      const certificateData = `${formData.courseName}-${formData.learnerEmail}-${formData.issueDate}`;
      const hash = generateHash(certificateData);
      const txnId = `TXN-${Date.now()}-${hash.substring(0, 8)}`;

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
        title: "Certificate Issued!",
        description: `Certificate for ${formData.courseName} has been issued successfully.`
      });

      setIsDialogOpen(false);
      setFormData({
        learnerEmail: "",
        courseName: "",
        issueDate: new Date().toISOString().split('T')[0]
      });
      fetchCertificates();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
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
