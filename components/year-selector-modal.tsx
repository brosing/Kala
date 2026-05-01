import React from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import { Heading } from "@/components/ui/heading";

interface YearSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedYear: number;
  onSelectYear: (year: number) => void;
}

const START_YEAR = new Date().getFullYear() - 20;
const END_YEAR = new Date().getFullYear();

export function YearSelectorModal({
  isOpen,
  onClose,
  selectedYear,
  onSelectYear,
}: YearSelectorModalProps) {
  const years = React.useMemo(() => {
    const result: number[] = [];
    for (let year = START_YEAR; year <= END_YEAR; year++) {
      result.push(year);
    }
    return result.reverse();
  }, []);

  const handleSelect = (year: number) => {
    onSelectYear(year);
    onClose();
  };

  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop />
      <ActionsheetContent>
        <ActionsheetDragIndicatorWrapper>
          <ActionsheetDragIndicator />
        </ActionsheetDragIndicatorWrapper>
        <Box className="px-4 py-3">
          <Heading size="md">Select Year</Heading>
        </Box>
        <Box className="px-4 py-4">
          <Box className="flex-row flex-wrap justify-between gap-y-3">
            {years.map((year) => (
              <Pressable
                key={year}
                onPress={() => handleSelect(year)}
                className={`
                  w-[31%] py-3 rounded-lg items-center justify-center
                  ${year === selectedYear ? "bg-primary-500" : "bg-background-50"}
                `}
              >
                <Text
                  className={`
                    text-base font-medium
                    ${year === selectedYear ? "text-white" : "text-typography-900"}
                  `}
                >
                  {year}
                </Text>
              </Pressable>
            ))}
          </Box>
        </Box>
        <Pressable onPress={onClose} className="px-4 py-3">
          <Text className="text-center text-typography-900">Cancel</Text>
        </Pressable>
      </ActionsheetContent>
    </Actionsheet>
  );
}
