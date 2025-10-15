import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Award, CheckCircle, FileCheck } from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-3xl animate-fade-up">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl animate-float shadow-lg hover:shadow-2xl transition-shadow duration-300">
              <Shield className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-fade-in">
              Blockchain Certificate Verification
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Secure, tamper-proof certificate issuance and verification powered by blockchain technology
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Button 
                size="lg" 
                onClick={() => navigate("/auth?mode=signup")} 
                className="text-lg px-8 shadow-lg hover:shadow-xl"
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate("/auth?mode=login")} 
                className="text-lg px-8"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple roles for complete certificate lifecycle management
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="animate-fade-up hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 border-2 hover:border-primary/50 group">
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Award className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Issuer (Admin)</CardTitle>
                <CardDescription>Issue Certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Create and issue certificates</span>
                  </li>
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Generate blockchain hash (SHA-256)</span>
                  </li>
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Store on blockchain with transaction ID</span>
                  </li>
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Manage certificate status</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="animate-fade-up hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 border-2 hover:border-secondary/50 group" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <FileCheck className="w-6 h-6 text-secondary-foreground" />
                </div>
                <CardTitle className="group-hover:text-secondary transition-colors">Learner</CardTitle>
                <CardDescription>View Certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                    <span>View all your certificates</span>
                  </li>
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                    <span>Access blockchain transaction ID</span>
                  </li>
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                    <span>Generate QR code for sharing</span>
                  </li>
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
                    <span>Share for verification</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="animate-fade-up hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-2 border-2 hover:border-accent/50 group" style={{ animationDelay: '0.2s' }}>
              <CardHeader>
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <Shield className="w-6 h-6 text-accent-foreground" />
                </div>
                <CardTitle className="group-hover:text-accent transition-colors">Verifier</CardTitle>
                <CardDescription>Verify Authenticity</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Upload or scan QR code</span>
                  </li>
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Match hash with blockchain</span>
                  </li>
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>Get instant verification result</span>
                  </li>
                  <li className="flex items-start gap-2 hover:text-foreground transition-colors">
                    <CheckCircle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    <span>View certificate details</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-up">
            Start Issuing Secure Certificates Today
          </h2>
          <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Join the blockchain revolution in certificate verification. Tamper-proof, secure, and instantly verifiable.
          </p>
          <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => navigate("/auth?mode=signup")} 
              className="text-lg px-8 shadow-xl hover:shadow-2xl"
            >
              Create Your Account
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
          <p>© 2025 Blockchain Certificate Verification.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
