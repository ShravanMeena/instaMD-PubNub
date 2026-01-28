import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image as ImageIcon, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MessageInput = ({ onSendMessage, onTyping, pubnub, channel, currentUser }) => {
    const [text, setText] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    // Refs
    const fileInputRef = useRef(null);
    const emojiRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    
    // Click outside to close emoji picker
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEmoji && emojiRef.current && !emojiRef.current.contains(event.target)) {
                setShowEmoji(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showEmoji]);

    const handleChange = (e) => {
        const newText = e.target.value;
        setText(newText);
        
        if (onTyping && newText.length > 0) {
            onTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
        }
    };

    const handleEmojiClick = (emojiData) => {
        setText(prev => prev + emojiData.emoji);
    };

     const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("File too large. Max 5MB.");
            return;
        }

        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        
        // Reset file input so same file can be selected again if needed
        e.target.value = '';
    };
    
    const cancelUpload = () => {
        setSelectedFile(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async (e) => {
        e.preventDefault();
        
        if (selectedFile) {
            setIsUploading(true);
            try {
                const result = await pubnub.sendFile({
                    channel: channel,
                    file: selectedFile,
                    message: {
                        type: 'image',
                        text: text, // Optional: send caption if text exists
                        sender: {
                            id: currentUser?.id,
                            name: currentUser?.name,
                            avatar: currentUser?.avatar,
                            color: currentUser?.color
                        }
                    }
                });
                console.log("File uploaded successfully");
                setSelectedFile(null);
                setPreview(null);
            } catch (err) {
                console.error("Upload failed", err);
                alert("Failed to upload image.");
            } finally {
                setIsUploading(false);
            }
        } 
        
        if (text.trim()) {
            onSendMessage(text);
            setText('');
        }
        
        setShowEmoji(false);
        if (onTyping) onTyping(false);
    };

    return (
        <div className="relative w-full">
            {showEmoji && (
                <div ref={emojiRef} className="absolute bottom-[100%] left-0 mb-4 z-50 shadow-xl rounded-xl border border-border overflow-hidden">
                    <EmojiPicker 
                        theme="dark" 
                        onEmojiClick={handleEmojiClick}
                        width={320}
                        height={400}
                    />
                </div>
            )}
            
            {/* Image Preview */}
            {preview && (
                 <div className="absolute bottom-[100%] left-4 mb-2 p-2 bg-card border border-border rounded-lg shadow-lg flex items-start gap-2 z-40 animate-in slide-in-from-bottom-2">
                    <img src={preview} alt="Preview" className="h-20 w-auto rounded-md object-cover" />
                    <button 
                        onClick={cancelUpload}
                        className="bg-destructive/10 text-destructive hover:bg-destructive/20 p-1 rounded-full transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    {isUploading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg backdrop-blur-[1px]">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                    )}
                 </div>
            )}
            
            <form className="flex items-center gap-2" onSubmit={handleSend}>
                <Button 
                    type="button" 
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-primary hover:bg-muted"
                    onClick={() => setShowEmoji(!showEmoji)}
                    disabled={isUploading}
                >
                    <Smile className="h-6 w-6" />
                </Button>

                <Button 
                    type="button" 
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-muted-foreground hover:text-primary hover:bg-muted"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    <ImageIcon className="h-6 w-6" />
                </Button>

                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                
                <Input
                    className="flex-1 rounded-full bg-background/50 border-input h-11 px-4 transition-all focus:bg-background focus:ring-2 focus:ring-primary/20"
                    value={text}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
                    autoFocus
                    disabled={isUploading}
                />
                
                <Button 
                    type="submit" 
                    size="icon"
                    className={cn(
                        "rounded-full h-11 w-11 transition-all duration-300 shadow-lg",
                        (text.trim() || selectedFile) && !isUploading ? "bg-primary text-primary-foreground hover:scale-105" : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed hover:bg-muted"
                    )}
                    disabled={(!text.trim() && !selectedFile) || isUploading}
                >
                    <Send className="h-5 w-5 ml-0.5" />
                </Button>
            </form>
        </div>
    );
};

export default MessageInput;
