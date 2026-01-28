import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare } from 'lucide-react';

const UserProfileDialog = ({ user, isOpen, onClose, onMessageClick }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>User Profile</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-4 py-6">
                    <Avatar className="h-20 w-20 border-4 border-muted">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="text-2xl">{user?.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                        <h3 className="text-lg font-bold">{user?.name}</h3>
                        <p className="text-sm text-muted-foreground">App User</p>
                    </div>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button className="w-full sm:w-auto" onClick={onMessageClick}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Message
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UserProfileDialog;
