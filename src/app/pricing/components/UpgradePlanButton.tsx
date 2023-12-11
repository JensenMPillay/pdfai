"use client";
import { trpc } from "@/app/_trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const UpgradePlanButton = () => {
  const { mutate: createStripeSession } =
    trpc.user.createStripeSession.useMutation({
      onSuccess: ({ url }) => {
        window.location.href = url ?? "/dashboard/billing";
      },
    });

  return (
    <Button onClick={() => createStripeSession()} className="w-full">
      Upgrade now <ArrowRight className="ml-1.5 h-5 w-5" />
    </Button>
  );
};

export default UpgradePlanButton;
