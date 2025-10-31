import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Users, MessageCircle, UserPlus, LogOut } from "lucide-react";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Campus Connect
          </h1>
          <Button variant="ghost" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Welcome to Your Campus Network</h2>
            <p className="text-lg text-muted-foreground">
              Connect, collaborate, and grow with fellow students
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div
              onClick={() => navigate("/profile/me")}
              className="bg-card p-6 rounded-lg shadow-card hover:shadow-soft transition-smooth cursor-pointer border border-border"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your Profile</h3>
              <p className="text-muted-foreground">
                Update your information, skills, and achievements
              </p>
            </div>

            <div
              onClick={() => navigate("/students")}
              className="bg-card p-6 rounded-lg shadow-card hover:shadow-soft transition-smooth cursor-pointer border border-border"
            >
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Discover Students</h3>
              <p className="text-muted-foreground">
                Browse and connect with students across campus
              </p>
            </div>

            <div
              onClick={() => navigate("/campus-chat")}
              className="bg-card p-6 rounded-lg shadow-card hover:shadow-soft transition-smooth cursor-pointer border border-border"
            >
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Campus Chat</h3>
              <p className="text-muted-foreground">
                Join the open conversation with all students
              </p>
            </div>

            <div
              onClick={() => navigate("/messages")}
              className="bg-card p-6 rounded-lg shadow-card hover:shadow-soft transition-smooth cursor-pointer border border-border"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Direct Messages</h3>
              <p className="text-muted-foreground">
                Chat privately with your connections
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
