import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface CancelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isPending: boolean;
}

export default function CancelDialog({
    open,
    onOpenChange,
    onConfirm,
    isPending
}: CancelDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cancel Reservation</DialogTitle>
                </DialogHeader>
                <p>Are you sure you want to cancel this reservation? This action cannot be undone.</p>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        No, Keep It
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isPending}
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cancelling...
                            </>
                        ) : (
                            'Yes, Cancel It'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
