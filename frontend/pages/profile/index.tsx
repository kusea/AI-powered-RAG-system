import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Save, CheckCircle } from "lucide-react";
import api from "@/services/APIclient";

export default function ProfilePage(){
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        api.get("/profile/me").then(response => {
            setUsername(response.data.username);
            setEmail(response.data.email);
        });
    },[]);

    const handleUpdateProfile: React.ComponentProps<"form">["onSubmit"] = async(e) => {
        e.preventDefault();
        try{
            await api.put("/profile/me", {username: username, email: email}).then(response => {
                setStatus(`Profile updated successfully: ${response.data.message}`);
            });
        } catch (err) {
            setStatus(`Failed to update profile: ${err}`);
        } finally {
            setTimeout(() => setStatus(null), 3000);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-12 p-8 border rounded-2xl bg-card text-foreground shadow-sm space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Personal Information</h1>
                <p className="text-sm text-muted-foreground">Manage and update your account information</p>
            </div>

            {status && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                    <CheckCircle className="h-5 w-5" /> {status}
                </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />Username</label>
                    <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full gap-2 flex items-center justify-center">
                    <Save className="h-4 w-4" /> Save changes
                </Button>
            </form>
            </div>
    );
}