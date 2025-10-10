import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getSecureErrorMessage, logError } from "@/lib/errorHandler";
import { emailSchema, passwordSchema, userNameSchema } from "@/lib/inputValidation";
import { Shield } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [authMethod, setAuthMethod] = useState<"email" | "phone" | "aadhaar">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"learner" | "verifier">("learner");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setIsLogin(false);
    } else if (mode === "login") {
      setIsLogin(true);
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      logError(error, "Google Sign In");
      toast({
        variant: "destructive",
        title: "Error",
        description: getSecureErrorMessage(error),
      });
    }
  };

  const handleDigilockerSignIn = async () => {
    toast({
      title: "Coming Soon",
      description: "DigiLocker integration will be available soon",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs before submission
    try {
      if (authMethod === "email") {
        emailSchema.parse(email);
        
        // For verifiers, block personal email domains
        if (!isLogin && role === "verifier") {
          const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'protonmail.com', 'aol.com'];
          const emailDomain = email.split('@')[1]?.toLowerCase();
          
          if (personalDomains.includes(emailDomain)) {
            throw new Error("Verifiers must use a company email address, not personal email providers");
          }
        }
      } else if (authMethod === "phone") {
        if (!phone || phone.length < 10) {
          throw new Error("Please enter a valid phone number");
        }
      } else if (authMethod === "aadhaar") {
        if (!aadhaar || aadhaar.length !== 12) {
          throw new Error("Please enter a valid 12-digit Aadhaar number");
        }
      }
      
      passwordSchema.parse(password);
      if (!isLogin) {
        userNameSchema.parse(name);
      }
    } catch (validationError: any) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: validationError.message || validationError.errors?.[0]?.message || "Invalid input",
      });
      return;
    }
    
    let error;
    if (isLogin) {
      // For login, only email/password is supported
      if (authMethod !== "email") {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please use email to sign in",
        });
        return;
      }
      const result = await signIn(email, password);
      error = result.error;
    } else {
      // For signup, pass the selected role and auth method
      const identifier = authMethod === "email" ? email : authMethod === "phone" ? phone : aadhaar;
      const result = await signUp(identifier, password, name, role, authMethod);
      error = result.error;
    }

    if (error) {
      logError(error, "Authentication");
      toast({
        variant: "destructive",
        title: "Error",
        description: getSecureErrorMessage(error),
      });
    } else {
      toast({
        title: "Success",
        description: isLogin ? "Logged in successfully" : "Account created successfully",
      });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-2">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{isLogin ? "Sign In" : "Create Account"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Welcome back to the Certificate Verification System"
              : "Join the blockchain-secured certificate platform"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>I am a</Label>
                  <RadioGroup value={role} onValueChange={(value: "learner" | "verifier") => setRole(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="learner" id="learner" />
                      <Label htmlFor="learner" className="font-normal cursor-pointer">Learner</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="verifier" id="verifier" />
                      <Label htmlFor="verifier" className="font-normal cursor-pointer">Verifier</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label>Sign up with</Label>
                  <RadioGroup value={authMethod} onValueChange={(value: "email" | "phone" | "aadhaar") => setAuthMethod(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="email" id="email-method" />
                      <Label htmlFor="email-method" className="font-normal cursor-pointer flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="phone" id="phone-method" />
                      <Label htmlFor="phone-method" className="font-normal cursor-pointer flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="aadhaar" id="aadhaar-method" />
                      <Label htmlFor="aadhaar-method" className="font-normal cursor-pointer flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Aadhaar Number
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
            
            {authMethod === "email" && (
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email
                  {!isLogin && role === "verifier" && (
                    <span className="text-xs text-muted-foreground ml-2">(Company email required)</span>
                  )}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={!isLogin && role === "verifier" ? "name@company.com" : "your@email.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {!isLogin && role === "verifier" && (
                  <p className="text-xs text-muted-foreground">
                    Personal email providers (Gmail, Yahoo, etc.) are not allowed for verifiers
                  </p>
                )}
              </div>
            )}
            
            {authMethod === "phone" && !isLogin && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            )}
            
            {authMethod === "aadhaar" && !isLogin && (
              <div className="space-y-2">
                <Label htmlFor="aadhaar">Aadhaar Number</Label>
                <Input
                  id="aadhaar"
                  type="text"
                  placeholder="XXXX XXXX XXXX"
                  maxLength={12}
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button type="submit" className="w-full">
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>
          
          {!isLogin && (
            <>
              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>
              
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleGoogleSignIn}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleDigilockerSignIn}
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Sign up with DigiLocker
                </Button>
              </div>
            </>
          )}
          
          <div className="mt-4 text-center text-sm">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
