import React from "react";
import { View, StyleSheet } from "react-native";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { storage } from "@/services/storage";
import { useRouter } from "expo-router";

export default function OnboardingScreen() {
  const router = useRouter();

  const handleComplete = async () => {
    try {
      await storage.setOnboardingCompleted();
      router.replace("/" as any);
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Navigate anyway to prevent user from being stuck
      router.replace("/" as any);
    }
  };

  return (
    <View style={styles.container}>
      <OnboardingFlow onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
