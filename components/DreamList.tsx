import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";

import DreamForm from "@/components/DreamForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { Dream } from "@/types/Dream";

const emotionLabels: Record<string, string> = {
  happy: "Heureux",
  sad: "Triste",
  anxious: "Anxieux",
  neutral: "Neutre",
  angry: "En colère",
};

const dreamTypeLabels: Record<string, string> = {
  nightmare: "Cauchemar",
  dream: "Rêve",
  neutral: "Neutre",
};

const normalizeForSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function DreamList() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [selectedDream, setSelectedDream] = useState<Dream | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [dreamBeingEdited, setDreamBeingEdited] = useState<Dream | null>(null);

  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const drawerTranslateY = useRef(new Animated.Value(Dimensions.get("window").height)).current;

  const modalTranslateX = useRef(new Animated.Value(Dimensions.get("window").width)).current;

  const openDrawer = (dream: Dream) => {
    setSelectedDream(dream);
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(drawerTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (afterClose?: () => void) => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(drawerTranslateY, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(false);
      setSelectedDream(null);
      afterClose?.();
    });
  };

  const deleteDream = async (dreamId: string) => {
    try {
      const data = await AsyncStorage.getItem("dreamFormDataArray");
      const allDreams: Dream[] = data ? JSON.parse(data) : [];
      const filtered = allDreams.filter((d) => d.id !== dreamId);
      await AsyncStorage.setItem("dreamFormDataArray", JSON.stringify(filtered));
      setDreams(filtered);
      closeDrawer();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    }
  };

  const fetchDreams = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem("dreamFormDataArray");
      const dreamFormDataArray: Dream[] = data ? JSON.parse(data) : [];
      setDreams(dreamFormDataArray);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
    }
  }, []);

  // Ce useEffect est exécuté à l'instanciation du composant pour charger la liste initiale
  useEffect(() => {
    fetchDreams();
  }, [fetchDreams]);

  useFocusEffect(
    useCallback(() => {
      fetchDreams();
    }, [fetchDreams]),
  );

  const openEditModal = (dream: Dream) => {
    closeDrawer(() => {
      const width = Dimensions.get("window").width;
      setDreamBeingEdited(dream);
      modalTranslateX.setValue(width);
      setEditModalVisible(true);

      requestAnimationFrame(() => {
        Animated.timing(modalTranslateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    });
  };

  const closeEditModal = () => {
    const width = Dimensions.get("window").width;
    Animated.timing(modalTranslateX, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setEditModalVisible(false);
      setDreamBeingEdited(null);
    });
  };

  const filteredDreams = useMemo(() => {
    const normalizedQuery = normalizeForSearch(searchQuery);
    if (!normalizedQuery) return dreams;

    const tokens = normalizedQuery.split(/[\s,]+/g).filter(Boolean);
    if (tokens.length === 0) return dreams;

    return dreams.filter((dream) => {
      const keywordLabels = (dream.keywords ?? []).map((k) => k.label).join(" ");
      const characterNames = (dream.characters ?? []).map((c) => c.name).join(" ");
      const emotionLabel = emotionLabels[dream.emotionalState] ?? dream.emotionalState;
      const typeLabel = dreamTypeLabels[dream.dreamType] ?? dream.dreamType;

      const haystack = normalizeForSearch(
        [dream.dreamText, keywordLabels, characterNames, dream.emotionalState, emotionLabel, dream.dreamType, typeLabel].filter(Boolean).join(" "),
      );

      return tokens.every((t) => haystack.includes(t));
    });
  }, [dreams, searchQuery]);

  return (
    <View className="p-4 gap-4 w-full">
      <Input
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Rechercher (mots-clés, émotion, type, personnage)"
        className="bg-white border-[#ddd]"
        autoCapitalize="none"
        autoCorrect={false}
      />

      {dreams.length === 0 && <Text className="text-[#999] text-center mt-8 italic">Aucun rêve enregistré pour le moment.</Text>}
      {filteredDreams.map((dream: Dream) => (
        <Pressable key={dream.id} onPress={() => openDrawer(dream)}>
          <View
            className="bg-white p-4 rounded-2xl border-l-4 border-l-[#7c73e6]"
            style={{ shadowColor: "#7c73e6", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }}
          >
            <Text className="font-bold text-base text-[#1a1a2e] mb-1" numberOfLines={1} ellipsizeMode="tail">
              {dream.dreamText}
            </Text>
            <Text className="text-[#999] text-xs mb-1">
              {dream.date ? new Date(dream.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Date inconnue"}
            </Text>
            <Text className="text-sm text-[#5c5470]">
              {dream.isLucidDream ? "Lucide" : "Non Lucide"} –{" "}
              {dream.dreamType === "nightmare" ? "Cauchemar" : dream.dreamType === "dream" ? "Rêve" : "Neutre"}
            </Text>
          </View>
        </Pressable>
      ))}

      <Modal visible={drawerVisible} animationType="none" transparent onRequestClose={() => closeDrawer()}>
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(26, 26, 46, 0.4)",
            opacity: overlayOpacity,
          }}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => closeDrawer()} />
        </Animated.View>
        <Animated.View
          style={{
            transform: [{ translateY: drawerTranslateY }],
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            maxHeight: "80%",
          }}
        >
          {selectedDream && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-xl font-bold text-[#1a1a2e]">Détails du rêve</Text>
                <Button onPress={() => openEditModal(selectedDream)} variant="outline" className="rounded-xl h-10 border-[#ddd]">
                  <Text className="text-[#1a1a2e] font-medium">Modifier</Text>
                </Button>
              </View>
              <Text className="text-[#999] text-xs mb-3">
                {selectedDream.date
                  ? (() => {
                      const d = new Date(selectedDream.date);
                      const datePart = d.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      });
                      const timePart = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                      return `${datePart} à ${timePart}`;
                    })()
                  : "Date inconnue"}
              </Text>
              <Separator className="bg-[#eee] mb-3" />

              <Text className="text-xs font-semibold text-[#5c5470] mt-3 mb-1 uppercase tracking-wide">Contenu</Text>
              <Text className="text-sm text-[#1a1a2e] leading-5">{selectedDream.dreamText}</Text>

              <Text className="text-xs font-semibold text-[#5c5470] mt-4 mb-1 uppercase tracking-wide">Type</Text>
              <View className="bg-[#f0eef9] self-start px-3 py-1 rounded-full mt-1">
                <Text className="text-sm text-[#7c73e6] font-medium">
                  {selectedDream.dreamType === "nightmare" ? "Cauchemar" : selectedDream.dreamType === "dream" ? "Rêve" : "Neutre"}
                </Text>
              </View>

              <Text className="text-xs font-semibold text-[#5c5470] mt-4 mb-1 uppercase tracking-wide">Rêve lucide</Text>
              <Text className="text-sm text-[#1a1a2e]">{selectedDream.isLucidDream ? "Oui" : "Non"}</Text>

              <Text className="text-xs font-semibold text-[#5c5470] mt-4 mb-1 uppercase tracking-wide">État émotionnel</Text>
              <View className="bg-[#f0eef9] self-start px-3 py-1 rounded-full mt-1">
                <Text className="text-sm text-[#7c73e6] font-medium">
                  {emotionLabels[selectedDream.emotionalState] ?? selectedDream.emotionalState}
                </Text>
              </View>

              <Text className="text-xs font-semibold text-[#5c5470] mt-4 mb-1 uppercase tracking-wide">Intensité émotionnelle</Text>
              <Text className="text-sm text-[#1a1a2e]">{selectedDream.emotionalIntensity}/10</Text>

              <Text className="text-xs font-semibold text-[#5c5470] mt-4 mb-1 uppercase tracking-wide">Clarté du rêve</Text>
              <Text className="text-sm text-[#1a1a2e]">{selectedDream.clarity}/10</Text>

              <Text className="text-xs font-semibold text-[#5c5470] mt-4 mb-1 uppercase tracking-wide">Qualité du sommeil</Text>
              <Text className="text-sm text-[#1a1a2e]">{selectedDream.sleepQuality}/10</Text>

              {selectedDream.place ? (
                <>
                  <Text className="text-xs font-semibold text-[#5c5470] mt-4 mb-1 uppercase tracking-wide">Lieu</Text>
                  <Text className="text-sm text-[#1a1a2e]">{selectedDream.place}</Text>
                </>
              ) : null}

              {selectedDream.characters && selectedDream.characters.length > 0 && (
                <>
                  <Text className="text-xs font-semibold text-[#5c5470] mt-4 mb-1 uppercase tracking-wide">Personnages</Text>
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    {selectedDream.characters.map((c) => (
                      <View key={c.id} className="bg-[#f0eef9] px-3 py-1 rounded-full">
                        <Text className="text-sm text-[#7c73e6] font-medium">{c.name}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {selectedDream.keywords && selectedDream.keywords.length > 0 && (
                <>
                  <Text className="text-xs font-semibold text-[#5c5470] mt-4 mb-1 uppercase tracking-wide">Mots-clés</Text>
                  <View className="flex-row flex-wrap gap-2 mt-1">
                    {selectedDream.keywords.map((kw) => (
                      <View key={kw.id} className="bg-[#f0eef9] px-3 py-1 rounded-full">
                        <Text className="text-sm text-[#7c73e6] font-medium">{kw.label}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {selectedDream.personnalSignificance ? (
                <>
                  <Text className="text-xs font-semibold text-[#5c5470] mt-4 mb-1 uppercase tracking-wide">Signification personnelle</Text>
                  <Text className="text-sm text-[#1a1a2e] leading-5">{selectedDream.personnalSignificance}</Text>
                </>
              ) : null}

              <View className="flex-row gap-3 mt-6">
                <Button onPress={() => closeDrawer()} variant="outline" className="flex-1 rounded-xl h-11 border-[#ddd]">
                  <Text className="text-[#1a1a2e] font-medium">Fermer</Text>
                </Button>
                <Button onPress={() => deleteDream(selectedDream.id)} variant="destructive" className="flex-1 rounded-xl h-11">
                  <Text className="text-white font-medium">Supprimer</Text>
                </Button>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </Modal>

      <Modal visible={editModalVisible} animationType="none" transparent onRequestClose={closeEditModal}>
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            transform: [{ translateX: modalTranslateX }],
            backgroundColor: "white",
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false} className="bg-white">
            <View className="px-4 mt-4">
              <Button onPress={() => closeEditModal()} variant="outline" className="self-start rounded-xl h-10 border-[#ddd]">
                <Text className="text-[#1a1a2e] font-medium">Retour</Text>
              </Button>
            </View>

            {dreamBeingEdited ? (
              <DreamForm
                defaultValue={dreamBeingEdited}
                onSubmitted={() => {
                  closeEditModal();
                  fetchDreams();
                }}
              />
            ) : null}
          </ScrollView>
        </Animated.View>
      </Modal>
    </View>
  );
}
