import { ScrollView, View } from "react-native";

import DreamForm from "@/components/DreamForm";
import { Text } from "@/components/ui/text";

export default function TabOneScreen() {
  return (
    <ScrollView className="bg-[#f5f5fa]">
      <View className="flex-1">
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-[#1a1a2e]">Nouveau rêve</Text>
          <Text className="text-sm text-[#999] mt-1">Décrivez votre rêve avant de l'oublier</Text>
        </View>
        <DreamForm />
      </View>
    </ScrollView>
  );
}
