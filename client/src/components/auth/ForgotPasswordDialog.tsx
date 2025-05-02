
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail } from 'lucide-react';
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Form schema for validation
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

const ForgotPasswordDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      console.log("Form values:", values);
      // Mock password reset request - would connect to a real auth service in production
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSuccess(true);
      toast.success("Password reset instructions sent to your email!");
      
      // Close dialog after a delay
      setTimeout(() => {
        setIsOpen(false);
        // Reset success state after closing
        setTimeout(() => setIsSuccess(false), 300);
      }, 2000);
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Failed to send reset instructions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dialog close
  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form and states when dialog closes
      form.reset();
      setIsSuccess(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="link" className="text-primary p-0 h-auto font-medium text-sm">
          Forgot password?
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="gradient-heading">Forgot your password?</DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you instructions to reset your password.
          </DialogDescription>
        </DialogHeader>
        
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center p-4 space-y-4">
            <div className="bg-green-100 text-green-800 p-3 rounded-full">
              <Mail className="h-6 w-6" />
            </div>
            <p className="text-center font-medium">
              Check your email for reset instructions
            </p>
            <p className="text-center text-sm text-muted-foreground">
              We've sent instructions to reset your password. Please check your inbox.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="email@example.com" 
                          className="pl-10" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Instructions"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
