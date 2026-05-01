import { Stack } from 'expo-router';

export default function DayDetailLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[date]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
