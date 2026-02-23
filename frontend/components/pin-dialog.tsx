'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface PinDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
}

export function PinDialog({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    description = 'Warning: This action requires authorization.',
}: PinDialogProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    // Required PIN for sensitive actions
    const REQUIRED_PIN = '036409';

    const handleConfirm = () => {
        if (pin === REQUIRED_PIN) {
            setError('');
            setPin(''); // Reset on success
            onConfirm();
        } else {
            setError('Incorrect PIN. Authorization failed.');
        }
    };

    const handleClose = () => {
        setError('');
        setPin('');
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleConfirm();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-destructive font-bold flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground pt-2">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2 relative">
                        <Label htmlFor="pin" className="text-sm font-semibold">
                            Enter Administrator PIN
                        </Label>
                        <Input
                            id="pin"
                            type="password"
                            placeholder="******"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value);
                                if (error) setError('');
                            }}
                            onKeyDown={handleKeyDown}
                            className={`letter-spacing-[0.2em] font-mono ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                            autoFocus
                        />
                        {error && (
                            <p className="text-xs text-destructive font-medium mt-1 absolute -bottom-5 left-0">
                                {error}
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-4 sm:justify-end gap-2">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm}>
                        Authorize
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
