
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CircleSlash, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <div className="p-4 rounded-full bg-quiz-secondary/30 mb-6 inline-block">
          <CircleSlash className="h-12 w-12 text-quiz-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-4 gradient-heading">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Oops! The page you're looking for doesn't exist.
        </p>
        <Button className="bg-quiz-primary hover:bg-quiz-primary/90">
          <Home className="mr-2 h-4 w-4" />
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
