import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Search, UserPlus, UserCheck, UserX } from "lucide-react";

const Students = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const { data: studentsData } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user?.id);

      const { data: connectionsData } = await supabase
        .from("connections")
        .select("*")
        .or(`user_id.eq.${user?.id},connected_user_id.eq.${user?.id}`);

      setStudents(studentsData || []);
      setConnections(connectionsData || []);
    } catch (error: any) {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const getConnectionStatus = (studentId: string) => {
    return connections.find(
      (c) =>
        (c.user_id === user?.id && c.connected_user_id === studentId) ||
        (c.connected_user_id === user?.id && c.user_id === studentId)
    );
  };

  const sendConnectionRequest = async (studentId: string) => {
    try {
      const { error } = await supabase.from("connections").insert({
        user_id: user?.id,
        connected_user_id: studentId,
        status: "pending",
      });

      if (error) throw error;
      toast.success("Connection request sent");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const acceptConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: "accepted" })
        .eq("id", connectionId);

      if (error) throw error;
      toast.success("Connection accepted");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Discover Students</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-4">
            {filteredStudents.map((student) => {
              const connection = getConnectionStatus(student.id);
              const isPending = connection?.status === "pending";
              const isAccepted = connection?.status === "accepted";
              const receivedRequest =
                connection && connection.connected_user_id === user?.id && isPending;

              return (
                <Card key={student.id} className="shadow-card hover:shadow-soft transition-smooth">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/profile/${student.id}`)}
                      >
                        <h3 className="text-lg font-semibold">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">{student.department}</p>
                        {student.bio && (
                          <p className="text-sm mt-2 line-clamp-2">{student.bio}</p>
                        )}
                      </div>
                      <div>
                        {isAccepted ? (
                          <Badge variant="secondary">
                            <UserCheck className="mr-1 h-3 w-3" />
                            Connected
                          </Badge>
                        ) : receivedRequest ? (
                          <Button
                            size="sm"
                            onClick={() => acceptConnection(connection.id)}
                          >
                            Accept
                          </Button>
                        ) : isPending ? (
                          <Badge variant="outline">
                            <UserX className="mr-1 h-3 w-3" />
                            Pending
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => sendConnectionRequest(student.id)}
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Students;