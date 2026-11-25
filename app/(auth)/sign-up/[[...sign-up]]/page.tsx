import { SignUp } from "@clerk/nextjs";
import { SignUpConsentGate } from "./SignUpConsentGate";

const appearance = {
  layout: {
    logoPlacement: "none" as const,
    showOptionalFields: false,
  },
  variables: {
    colorPrimary: "hsl(0 0% 9%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInputBackground: "hsl(0 0% 98%)",
    colorInputText: "hsl(0 0% 9%)",
    colorText: "hsl(0 0% 9%)",
    colorTextSecondary: "hsl(0 0% 45%)",
    colorNeutral: "hsl(0 0% 14%)",
    borderRadius: "0.625rem",
    fontFamily: "inherit",
    fontSize: "0.9rem",
  },
  elements: {
    card: "shadow-none border-0 p-0",
    rootBox: "w-full",
    cardBox: "w-full max-w-md",
    headerTitle: "text-2xl font-bold text-foreground",
    headerSubtitle: "text-muted-foreground text-sm",
    socialButtonsBlockButton:
      "border border-border bg-background hover:bg-muted text-foreground transition-colors",
    socialButtonsBlockButtonText: "font-medium",
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground text-xs",
    formFieldLabel: "text-sm font-medium text-foreground",
    formFieldInput:
      "border border-border bg-background rounded-lg text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-black/10 focus:border-black transition-colors",
    formButtonPrimary:
      "bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white font-medium transition-colors",
    footerActionLink: "text-zinc-800 hover:text-black font-medium underline-offset-4 hover:underline",
    identityPreviewEditButton: "text-zinc-700 hover:text-black",
    formResendCodeLink: "text-zinc-700 hover:text-black",
    otpCodeFieldInput: "border border-border",
    alertText: "text-sm",
    formFieldErrorText: "text-destructive text-xs",
  },
};

export default function SignUpPage() {
  return (
    <SignUpConsentGate>
      <SignUp appearance={appearance} forceRedirectUrl="/dashboard" />
    </SignUpConsentGate>
  );
}
