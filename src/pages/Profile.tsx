import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, Award } from "lucide-react";

const Profile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [skills, setSkills] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [newSkill, setNewSkill] = useState({ name: "", type: "technical" });
  const [newAchievement, setNewAchievement] = useState({ title: "", description: "", date: "" });

  const isOwnProfile = id === "me" || id === user?.id;

  useEffect(() => {
    loadProfile();
  }, [id, user]);

  const loadProfile = async () => {
    try {
      const profileId = id === "me" ? user?.id : id;
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      const { data: skillsData } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", profileId);

      const { data: achievementsData } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", profileId)
        .order("date", { ascending: false });

      setProfile(profileData);
      setSkills(skillsData || []);
      setAchievements(achievementsData || []);
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          department: profile.department,
          bio: profile.bio,
        })
        .eq("id", user?.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      setEditing(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const addSkill = async () => {
    if (!newSkill.name.trim()) return;
    try {
      const { error } = await supabase.from("skills").insert({
        user_id: user?.id,
        skill_name: newSkill.name,
        skill_type: newSkill.type,
      });

      if (error) throw error;
      setNewSkill({ name: "", type: "technical" });
      loadProfile();
      toast.success("Skill added");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const removeSkill = async (skillId: string) => {
    try {
      const { error } = await supabase.from("skills").delete().eq("id", skillId);
      if (error) throw error;
      loadProfile();
      toast.success("Skill removed");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const addAchievement = async () => {
    if (!newAchievement.title.trim()) return;
    try {
      const { error } = await supabase.from("achievements").insert({
        user_id: user?.id,
        title: newAchievement.title,
        description: newAchievement.description,
        date: newAchievement.date || null,
      });

      if (error) throw error;
      setNewAchievement({ title: "", description: "", date: "" });
      loadProfile();
      toast.success("Achievement added");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const removeAchievement = async (achievementId: string) => {
    try {
      const { error } = await supabase.from("achievements").delete().eq("id", achievementId);
      if (error) throw error;
      loadProfile();
      toast.success("Achievement removed");
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

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Profile not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <header className="bg-card/80 backdrop-blur-sm border-b border-border shadow-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea
                      value={profile.bio || ""}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={updateProfile}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-2xl font-bold">{profile.name}</h3>
                    <p className="text-muted-foreground">{profile.department}</p>
                  </div>
                  {profile.bio && (
                    <div>
                      <Label>About</Label>
                      <p className="text-sm mt-1">{profile.bio}</p>
                    </div>
                  )}
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm mt-1">{profile.email}</p>
                  </div>
                  {isOwnProfile && (
                    <Button onClick={() => setEditing(true)}>Edit Profile</Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {skills
                  .filter((s) => s.skill_type === "technical")
                  .map((skill) => (
                    <Badge key={skill.id} variant="default">
                      {skill.skill_name}
                      {isOwnProfile && (
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {skills
                  .filter((s) => s.skill_type === "soft")
                  .map((skill) => (
                    <Badge key={skill.id} variant="secondary">
                      {skill.skill_name}
                      {isOwnProfile && (
                        <button
                          onClick={() => removeSkill(skill.id)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
              </div>
              {isOwnProfile && (
                <div className="flex gap-2 pt-4 border-t">
                  <Input
                    placeholder="Skill name"
                    value={newSkill.name}
                    onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  />
                  <select
                    value={newSkill.type}
                    onChange={(e) => setNewSkill({ ...newSkill, type: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="technical">Technical</option>
                    <option value="soft">Soft Skill</option>
                  </select>
                  <Button onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-start gap-3 p-4 border rounded-lg"
                >
                  <Award className="h-5 w-5 text-accent mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold">{achievement.title}</h4>
                    {achievement.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                    )}
                    {achievement.date && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {isOwnProfile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAchievement(achievement.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {isOwnProfile && (
                <div className="space-y-2 pt-4 border-t">
                  <Input
                    placeholder="Achievement title"
                    value={newAchievement.title}
                    onChange={(e) =>
                      setNewAchievement({ ...newAchievement, title: e.target.value })
                    }
                  />
                  <Textarea
                    placeholder="Description"
                    value={newAchievement.description}
                    onChange={(e) =>
                      setNewAchievement({ ...newAchievement, description: e.target.value })
                    }
                  />
                  <Input
                    type="date"
                    value={newAchievement.date}
                    onChange={(e) =>
                      setNewAchievement({ ...newAchievement, date: e.target.value })
                    }
                  />
                  <Button onClick={addAchievement}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Achievement
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Profile;