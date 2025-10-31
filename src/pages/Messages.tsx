import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Send, Paperclip } from "lucide-react";

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConnections();
  }, [user]);

  useEffect(() => {
    if (selectedConnection) {
      loadMessages();
      subscribeToMessages();
    }
  }, [selectedConnection]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConnections = async () => {
    try {
      const { data } = await supabase
        .from("connections")
        .select(`
          *,
          user:user_id(id, name),
          connected_user:connected_user_id(id, name)
        `)
        .eq("status", "accepted")
        .or(`user_id.eq.${user?.id},connected_user_id.eq.${user?.id}`);

      const formatted = data?.map((conn) => {
        const otherUser =
          conn.user_id === user?.id ? conn.connected_user : conn.user;
        return { ...conn, otherUser };
      });

      setConnections(formatted || []);
    } catch (error: any) {
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConnection) return;

    try {
      const { data } = await supabase
        .from("direct_messages")
        .select(`
          *,
          sender:sender_id(name)
        `)
        .or(
          `and(sender_id.eq.${user?.id},receiver_id.eq.${selectedConnection.otherUser.id}),and(sender_id.eq.${selectedConnection.otherUser.id},receiver_id.eq.${user?.id})`
        )
        .order("created_at", { ascending: true });

      setMessages(data || []);
    } catch (error: any) {
      toast.error("Failed to load messages");
    }
  };

  const subscribeToMessages = () => {
    if (!selectedConnection) return;

    const channel = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        async (payload) => {
          if (
            (payload.new.sender_id === user?.id &&
              payload.new.receiver_id === selectedConnection.otherUser.id) ||
            (payload.new.sender_id === selectedConnection.otherUser.id &&
              payload.new.receiver_id === user?.id)
          ) {
            const { data: sender } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", payload.new.sender_id)
              .single();

            setMessages((prev) => [
              ...prev,
              { ...payload.new, sender: { name: sender?.name } },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConnection) return;

    try {
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user?.id,
        receiver_id: selectedConnection.otherUser.id,
        message: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConnection) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("chat-files")
        .getPublicUrl(fileName);

      const { error } = await supabase.from("direct_messages").insert({
        sender_id: user?.id,
        receiver_id: selectedConnection.otherUser.id,
        file_url: publicUrl,
        file_name: file.name,
      });

      if (error) throw error;
      toast.success("File uploaded");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex flex-col">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">
            {selectedConnection ? selectedConnection.otherUser.name : "Direct Messages"}
          </h1>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4 flex gap-4 max-w-6xl">
        <Card className="w-64 p-4 shadow-card overflow-y-auto">
          <h3 className="font-semibold mb-4">Connections</h3>
          <div className="space-y-2">
            {connections.map((conn) => (
              <button
                key={conn.id}
                onClick={() => setSelectedConnection(conn)}
                className={`w-full text-left p-3 rounded-lg transition-smooth ${
                  selectedConnection?.id === conn.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                {conn.otherUser.name}
              </button>
            ))}
          </div>
        </Card>

        {selectedConnection ? (
          <div className="flex-1 flex flex-col">
            <Card className="flex-1 p-4 mb-4 overflow-y-auto shadow-card">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender_id === user?.id ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender_id === user?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {msg.message && <p className="text-sm">{msg.message}</p>}
                      {msg.file_url && (
                        <a
                          href={msg.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm underline"
                        >
                          📎 {msg.file_name}
                        </a>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </Card>

            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a connection to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Messages;