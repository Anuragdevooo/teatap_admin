import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button, EmptyState } from '@/components/ui';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="grid min-h-[60vh] place-items-center">
      <EmptyState
        icon={<Compass />}
        title="That page does not exist"
        description="The link may be out of date, or the screen was renamed. Everything in the console is reachable from the sidebar, or from Ctrl K."
        action={
          <Button
            variant="primary"
            leadingIcon={<Home className="size-4" />}
            onClick={() => navigate('/')}
          >
            Back to dashboard
          </Button>
        }
      />
    </div>
  );
}
