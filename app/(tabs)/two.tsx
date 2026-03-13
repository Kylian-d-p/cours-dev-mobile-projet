import { ScrollView, View } from "react-native";

import DreamList from "@/components/DreamList";
import { Text } from "@/components/ui/text";

export default function TabTwoScreen() {
  return (
    <ScrollView className="bg-[#f5f5fa]">
      <View className="flex-1">
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-[#1a1a2e]">Mes rêves</Text>
          <Text className="text-sm text-[#999] mt-1">Retrouvez tous vos rêves enregistrés</Text>
        </View>
        <DreamList />
      </View>
    </ScrollView>
  );
}
