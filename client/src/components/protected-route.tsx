import { Redirect, Route, RouteProps } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType;
}

export function ProtectedRoute({ component: Component, ...rest }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Show loading state while auth is being checked
  if (isLoading) {
    return (
      <Route {...rest}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // If user is not authenticated, redirect to auth page
  if (!user) {
    return (
      <Route {...rest}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If user is authenticated, render the component
  return (
    <Route {...rest}>
      <Component />
    </Route>
  );
}