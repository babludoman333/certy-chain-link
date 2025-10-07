import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import IssuerDashboard from "@/components/dashboards/IssuerDashboard";
import LearnerDashboard from "@/components/dashboards/LearnerDashboard";
import VerifierDashboard from "@/components/dashboards/VerifierDashboard";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchUserRole();
    }
  }, [user, authLoading, navigate]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No role assigned. Please contact support.</p>
      </div>
    );
  }

  return (
    <>
      {userRole === 'issuer' && <IssuerDashboard />}
      {userRole === 'learner' && <LearnerDashboard />}
      {userRole === 'verifier' && <VerifierDashboard />}
    </>
  );
};

export default Dashboard;
