
import React from 'react';
import { Button } from './ui/button';
import { Check } from 'lucide-react';
import { dispatchCodeAccepted } from '../utils/codeBlockUtils';
import { toast } from 'sonner';

interface AcceptCodeButtonProps {
  filePath: string;
  code: string;
  onAccept?: () => void;
}

const AcceptCodeButton: React.FC<AcceptCodeButtonProps> = ({ filePath, code, onAccept }) => {
  const handleAccept = () => {
    if (!filePath) {
      toast.error('No file path specified for this code block');
      return;
    }
    
    // Dispatch the event for editor to catch
    dispatchCodeAccepted(filePath, code);
    
    // Call optional callback
    if (onAccept) {
      onAccept();
    }
    
    toast.success(`Code accepted for ${filePath}`);
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1 bg-green-900 text-white hover:bg-green-800 border-green-700"
      onClick={handleAccept}
    >
      <Check size={14} />
      <span>Accept</span>
    </Button>
  );
};

export default AcceptCodeButton;
