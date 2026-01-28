import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { MessageSquare, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const LoginScreen = () => {
    const { signIn, signUp } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);
        try {
            const { error } = await signIn(email, password);
            if (error) throw error;
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);
        try {
            const { data, error } = await signUp(email, password, username);
            if (error) throw error;
            
            if (data?.user && !data?.session) {
                setSuccessMessage("Account created! Please check your email to confirm.");
            } else {
                setSuccessMessage("Account created! Logging you in...");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[10%] right-[10%] w-64 h-64 bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
            </div>

            <Card className="w-full max-w-[420px] border-border bg-card/80 backdrop-blur-xl shadow-2xl z-10">
                <CardHeader className="flex flex-col items-center pb-6">
                    <div className="mb-4 bg-primary/10 p-4 rounded-2xl grid place-items-center shadow-inner">
                        <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Supabase Chat</CardTitle>
                    <CardDescription>Secure, real-time messaging</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                                <div className="space-y-2">
                                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                                     <Input 
                                        type="email" 
                                        placeholder="user@example.com" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                     />
                                </div>
                                <div className="space-y-2">
                                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                                     <Input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                     />
                                </div>
                                
                                {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                                <Button type="submit" className="w-full h-11 font-semibold mt-2" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </Button>
                            </form>
                        </TabsContent>
                        
                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="flex flex-col gap-4">
                                <div className="space-y-2">
                                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</label>
                                     <Input 
                                        type="text" 
                                        placeholder="cooluser123" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                     />
                                </div>
                                <div className="space-y-2">
                                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                                     <Input 
                                        type="email" 
                                        placeholder="user@example.com" 
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                     />
                                </div>
                                <div className="space-y-2">
                                     <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
                                     <Input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                     />
                                </div>

                                {error && <p className="text-sm text-destructive font-medium">{error}</p>}
                                {successMessage && <p className="text-sm text-green-600 font-medium">{successMessage}</p>}
                                
                                <Button type="submit" className="w-full h-11 font-semibold mt-2" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isLoading ? 'Creating Account...' : 'Sign Up'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
                <CardFooter className="flex justify-center pb-6">
                    <p className="text-xs text-muted-foreground text-center px-6">
                        By continuing, you simply agree to be awesome.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default LoginScreen;
