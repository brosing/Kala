import React, { useState } from "react";
import { ScrollView, Alert } from "react-native";
import { Plus } from "lucide-react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Pressable } from "@/components/ui/pressable";
import { User } from "@/types/day-entry";
import { UserItem } from "./user-item";
import { CreateUserModal } from "./create-user-modal";

interface UserManagementSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  isDarkMode: boolean;
  allUsers: User[];
  currentUser: User | null;
  onAddUser: (name: string) => Promise<void>;
  onSwitchUser: (userId: string) => Promise<void>;
  onDeleteUser: (userId: string) => void;
}

export function UserManagementSheet({
  bottomSheetRef,
  isDarkMode,
  allUsers,
  currentUser,
  onAddUser,
  onSwitchUser,
  onDeleteUser,
}: UserManagementSheetProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleAddPress = () => {
    setIsCreateModalOpen(true);
  };

  const handleSwitchPress = (userId: string) => {
    onSwitchUser(userId);
  };

  const handleCreateConfirm = async (name: string) => {
    try {
      await onAddUser(name);
      setIsCreateModalOpen(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to add user",
      );
    }
  };
  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["40%", "60%"]}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: isDarkMode ? "#171717" : "#FFFFFF",
      }}
      handleIndicatorStyle={{
        backgroundColor: isDarkMode
          ? "rgba(255,255,255,0.3)"
          : "rgba(0,0,0,0.1)",
      }}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={isDarkMode ? 0.7 : 0.5}
        />
      )}
    >
      <BottomSheetView style={{ flex: 1, padding: 20 }}>
        <VStack className="gap-6">
          <HStack className="items-center justify-between">
            <Heading size="md" className="text-typography-900">
              Switch User
            </Heading>
            <Pressable
              onPress={handleAddPress}
              className={`p-2 rounded-full active:bg-primary-100 ${
                isDarkMode ? "bg-primary-500/20" : "bg-primary-50/10"
              }`}
              disabled={allUsers.length >= 8}
            >
              <Icon
                as={Plus}
                size="md"
                className={
                  isDarkMode ? "text-primary-400" : "text-primary-600"
                }
              />
            </Pressable>
          </HStack>

          <ScrollView>
            <VStack className="gap-3 mb-20">
              {allUsers.map((user) => (
                <UserItem
                  key={user.id}
                  user={user}
                  isActive={currentUser?.id === user.id}
                  isDarkMode={isDarkMode}
                  onSwitch={handleSwitchPress}
                  onDelete={onDeleteUser}
                  canDelete={allUsers.length > 1}
                />
              ))}
            </VStack>
          </ScrollView>
        </VStack>
      </BottomSheetView>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onConfirm={handleCreateConfirm}
      />
    </BottomSheet>
  );
}
