import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';

interface UpgradeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  currentUsage: number;
  limit: number;
}

export function UpgradeDialog({
  isOpen,
  onClose,
  message,
  currentUsage,
  limit,
}: UpgradeDialogProps) {
  const navigate = useNavigate();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Upgrade to Pro</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>{message}</p>
            <p className="font-medium">
              Usage: {currentUsage} / {limit} free exports/link clicks
            </p>
            <p className="text-muted-foreground">
              Pro plan includes unlimited exports and more features.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              navigate('/settings');
              onClose();
            }}
          >
            Upgrade Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
