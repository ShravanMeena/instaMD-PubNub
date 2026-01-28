import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from 'lucide-react';

const GlobalErrorModal = ({ isOpen, onClose, title, message, type = 'error' }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        {type === 'error' ? (
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        <DialogTitle>{title}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default GlobalErrorModal;
