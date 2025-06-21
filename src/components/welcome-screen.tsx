"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { ArrowRight } from "lucide-react";
import { triggerVibration } from "@/lib/utils";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const handleGetStartedClick = () => {
    triggerVibration([100, 50, 100]);
    onGetStarted();
  }

  return (
    <Card className="w-full max-w-md shadow-xl text-center">
      <CardHeader>
        <div className="flex justify-center mb-4">
            <Icons.Logo className="w-16 h-16 text-primary" />
        </div>
        <CardTitle className="text-3xl">Welcome to the Showdown!</CardTitle>
        <CardDescription className="text-base pt-2">
            The ultimate AI-powered party game. Gather your friends and get ready for hilarious truths and wild dares.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Are you ready for the challenge?</p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleGetStartedClick} className="w-full" size="lg">
          Get Started
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
