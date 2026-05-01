import { useState, useEffect } from "react";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { storage } from "@/services/storage";
import { User } from "@/types/day-entry";

export function useUserManagement() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const user = await storage.getCurrentUser();
      const users = await storage.getUsers();
      setCurrentUser(user);
      setAllUsers(users);
    };
    loadUsers();
  }, []);

  const handleSwitchUser = async (userId: string, onComplete?: () => void) => {
    await storage.setCurrentUser(userId);
    const user = await storage.getCurrentUser();
    setCurrentUser(user);
    Haptics.selectionAsync();
    onComplete?.();
  };

  const handleAddUser = async (name: string) => {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) return;

    // Prevent duplicate names to avoid confusion
    const exists = allUsers.some(
      (u) => u.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (exists) {
      throw new Error(`User "${trimmedName}" already exists.`);
    }

    const newUser = await storage.addUser(trimmedName);
    setAllUsers((prev) => {
      if (prev.find((u) => u.id === newUser.id)) return prev;
      return [...prev, newUser];
    });
    await handleSwitchUser(newUser.id);
  };

  const handleDeleteUser = (userId: string) => {
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;

    Alert.alert(
      "Delete User Profile",
      `Are you sure you want to delete "${user.name}"? All photos and notes for this profile will be permanently removed from this device.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const previousUsers = [...allUsers];
            const previousCurrentUser = currentUser;

            const updatedUsers = allUsers.filter((u) => u.id !== userId);
            setAllUsers(updatedUsers);

            if (currentUser?.id === userId) {
              setCurrentUser(updatedUsers[0] || null);
            }

            try {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              await storage.deleteUser(userId);
            } catch (error) {
              setAllUsers(previousUsers);
              setCurrentUser(previousCurrentUser);
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "Failed to delete user",
              );
            }
          },
        },
      ],
    );
  };

  return {
    currentUser,
    allUsers,
    handleSwitchUser,
    handleAddUser,
    handleDeleteUser,
  };
}
