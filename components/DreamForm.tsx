import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider";
import { XIcon } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import uuid from "react-native-uuid";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, type Option } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Text } from "@/components/ui/text";
import { Textarea } from "@/components/ui/textarea";
import { formatDateForInput, isValidDateInput, parseDateInput } from "@/lib/utils";
import { Dream, DreamType } from "@/types/Dream";

type EmotionalState = Dream["emotionalState"];

const emotionalStates: { value: EmotionalState; label: string }[] = [
  { value: "happy", label: "Heureux" },
  { value: "sad", label: "Triste" },
  { value: "anxious", label: "Anxieux" },
  { value: "neutral", label: "Neutre" },
  { value: "angry", label: "En colère" },
];

const dreamTypes: { value: DreamType; label: string }[] = [
  { value: "nightmare", label: "Cauchemar" },
  { value: "dream", label: "Rêve" },
  { value: "neutral", label: "Neutre" },
];

type DreamFormProps = {
  defaultValue?: Dream;
  onSubmitted?: () => void;
};

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function formatTimeForInput(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

function isValidTimeInput(text: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(text)) return false;
  const [hoursText, minutesText] = text.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return false;
  if (hours < 0 || hours > 23) return false;
  if (minutes < 0 || minutes > 59) return false;
  return true;
}

function parseTimeInput(text: string): { hours: number; minutes: number } {
  const [hoursText, minutesText] = text.split(":");
  return {
    hours: Number(hoursText),
    minutes: Number(minutesText),
  };
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function DreamForm({ defaultValue, onSubmitted }: DreamFormProps) {
  const [dreamText, setDreamText] = useState<string>("");
  const [isLucidDream, setIsLucidDream] = useState<boolean>(false);
  const [dreamType, setDreamType] = useState<DreamType>("neutral");
  const [keywords, setKeywords] = useState<{ id: string; label: string }[]>([]);
  const [addingKeywordValue, setAddingKeywordValue] = useState<string>("");
  const [emotionalState, setEmotionalState] = useState<EmotionalState>("neutral");
  const [emotionalIntensity, setEmotionalIntensity] = useState<number>(5);
  const [place, setPlace] = useState<string>("");
  const [clarity, setClarity] = useState<number>(5);
  const [sleepQuality, setSleepQuality] = useState<number>(5);
  const [characters, setCharacters] = useState<{ id: string; name: string }[]>([]);
  const [addingCharacterValue, setAddingCharacterValue] = useState<string>("");
  const [personnalSignificance, setPersonnalSignificance] = useState<string>("");
  const [dreamDate, setDreamDate] = useState<Date>(() => stripTime(new Date()));
  const [dreamDateText, setDreamDateText] = useState<string>(() => formatDateForInput(stripTime(new Date())));
  const [dreamTimeText, setDreamTimeText] = useState<string>(() => formatTimeForInput(new Date()));
  const [lastValidTimeText, setLastValidTimeText] = useState<string>(() => formatTimeForInput(new Date()));
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  const isEditing = Boolean(defaultValue);

  const todayForInput = useMemo(() => formatDateForInput(new Date()), []);

  useEffect(() => {
    // Keep the web text input in sync when the date is updated elsewhere (native picker, reset after submit, etc.)
    setDreamDateText(formatDateForInput(dreamDate));
  }, [dreamDate]);

  useEffect(() => {
    if (!defaultValue) return;

    const parsedDate = defaultValue.date ? new Date(defaultValue.date) : new Date();
    const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
    const today = new Date();
    const clampedDate = safeDate.getTime() > today.getTime() ? today : safeDate;

    setDreamText(defaultValue.dreamText ?? "");
    setIsLucidDream(Boolean(defaultValue.isLucidDream));
    setDreamType(defaultValue.dreamType ?? "neutral");
    setKeywords(defaultValue.keywords ?? []);
    setAddingKeywordValue("");
    setEmotionalState(defaultValue.emotionalState ?? "neutral");
    setEmotionalIntensity(defaultValue.emotionalIntensity ?? 5);
    setPlace(defaultValue.place ?? "");
    setClarity(defaultValue.clarity ?? 5);
    setSleepQuality(defaultValue.sleepQuality ?? 5);
    setCharacters(defaultValue.characters ?? []);
    setAddingCharacterValue("");
    setPersonnalSignificance(defaultValue.personnalSignificance ?? "");
    setDreamDate(stripTime(clampedDate));
    setDreamDateText(formatDateForInput(stripTime(clampedDate)));
    const timeText = formatTimeForInput(clampedDate);
    setDreamTimeText(timeText);
    setLastValidTimeText(timeText);
  }, [defaultValue?.id]);

  const selectedEmotionalState: Option = {
    value: emotionalState,
    label: emotionalStates.find((e) => e.value === emotionalState)?.label ?? "Neutre",
  };

  const selectedDreamType: Option = {
    value: dreamType,
    label: dreamTypes.find((d) => d.value === dreamType)?.label ?? "Neutre",
  };

  const handleDreamSubmission = async () => {
    try {
      const existingData = await AsyncStorage.getItem("dreamFormDataArray");
      const formDataArray: Dream[] = existingData ? JSON.parse(existingData) : [];

      const dreamId = isEditing ? (defaultValue as Dream).id : (uuid.v4() as string);

      const timeCandidate = isValidTimeInput(dreamTimeText) ? dreamTimeText : lastValidTimeText;
      const parsedTime = isValidTimeInput(timeCandidate) ? parseTimeInput(timeCandidate) : { hours: 0, minutes: 0 };
      const combinedLocalDateTime = new Date(
        dreamDate.getFullYear(),
        dreamDate.getMonth(),
        dreamDate.getDate(),
        parsedTime.hours,
        parsedTime.minutes,
        0,
        0,
      );

      const dreamToSave: Dream = {
        id: dreamId,
        dreamText,
        isLucidDream,
        dreamType,
        keywords,
        date: combinedLocalDateTime.toISOString(),
        emotionalState,
        emotionalIntensity,
        place,
        clarity,
        sleepQuality,
        characters,
        personnalSignificance,
      };

      if (isEditing) {
        const index = formDataArray.findIndex((d) => d.id === dreamId);
        if (index >= 0) {
          formDataArray[index] = dreamToSave;
        } else {
          // Fallback requested: if the id does not exist anymore, create a new entry.
          formDataArray.push(dreamToSave);
        }
      } else {
        formDataArray.push(dreamToSave);
      }

      await AsyncStorage.setItem("dreamFormDataArray", JSON.stringify(formDataArray));

      onSubmitted?.();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des données:", error);
    }

    if (!isEditing) {
      setDreamText("");
      setIsLucidDream(false);
      setDreamType("neutral");
      setKeywords([]);
      setAddingKeywordValue("");
      setEmotionalState("neutral");
      setEmotionalIntensity(5);
      setPlace("");
      setClarity(5);
      setSleepQuality(5);
      setCharacters([]);
      setAddingCharacterValue("");
      setPersonnalSignificance("");
      const resetDate = stripTime(new Date());
      setDreamDate(resetDate);
      setDreamDateText(formatDateForInput(resetDate));
      const resetTimeText = formatTimeForInput(new Date());
      setDreamTimeText(resetTimeText);
      setLastValidTimeText(resetTimeText);
    }
  };

  return (
    <View className="p-5 gap-6">
      {/* Description du rêve */}
      <View className="gap-2">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Description du rêve</Label>
        <Textarea
          placeholder="Décrivez votre rêve en détail..."
          value={dreamText}
          onChangeText={setDreamText}
          numberOfLines={5}
          className="bg-white border-[#ddd] min-h-[120px]"
        />
      </View>

      <Separator className="bg-[#eee]" />

      {/* Date du rêve */}
      <View className="gap-2">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Date du rêve</Label>
        {Platform.OS === "web" ? (
          <Input
            value={dreamDateText}
            onChangeText={(text: string) => {
              setDreamDateText(text);
              if (isValidDateInput(text)) {
                const parsed = parseDateInput(text);
                const today = new Date();
                if (parsed.getTime() > today.getTime()) {
                  setDreamDate(stripTime(today));
                  setDreamDateText(formatDateForInput(stripTime(today)));
                } else {
                  setDreamDate(stripTime(parsed));
                }
              }
            }}
            onBlur={() => {
              // If user leaves the field with an invalid value, revert to the last valid date.
              if (!isValidDateInput(dreamDateText)) {
                setDreamDateText(formatDateForInput(dreamDate));
                return;
              }

              const parsed = parseDateInput(dreamDateText);
              const today = new Date();
              if (parsed.getTime() > today.getTime()) {
                setDreamDate(stripTime(today));
                setDreamDateText(formatDateForInput(stripTime(today)));
                return;
              }

              setDreamDate(stripTime(parsed));
            }}
            placeholder="AAAA-MM-JJ"
            type="date"
            max={todayForInput}
            className="bg-white border-[#ddd]"
          />
        ) : (
          <>
            <Pressable onPress={() => setShowDatePicker(true)} className="bg-white border border-[#ddd] rounded-md px-3 py-2.5 shadow-sm">
              <Text className="text-sm text-[#1a1a2e]">
                {dreamDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </Text>
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={dreamDate}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_event: any, selectedDate?: Date) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDreamDate(stripTime(selectedDate));
                }}
              />
            )}
          </>
        )}
      </View>

      {/* Heure du rêve */}
      <View className="gap-2">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Heure du rêve</Label>
        {Platform.OS === "web" ? (
          <Input
            value={dreamTimeText}
            onChangeText={(text: string) => {
              setDreamTimeText(text);
              if (isValidTimeInput(text)) setLastValidTimeText(text);
            }}
            onBlur={() => {
              if (!isValidTimeInput(dreamTimeText)) {
                setDreamTimeText(lastValidTimeText);
              }
            }}
            placeholder="HH:MM"
            type="time"
            step="60"
            pattern="\\d{2}:\\d{2}"
            className="bg-white border-[#ddd]"
          />
        ) : (
          <>
            <Pressable onPress={() => setShowTimePicker(true)} className="bg-white border border-[#ddd] rounded-md px-3 py-2.5 shadow-sm">
              <Text className="text-sm text-[#1a1a2e]">{dreamTimeText}</Text>
            </Pressable>
            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  const base = new Date();
                  const candidate = isValidTimeInput(dreamTimeText) ? dreamTimeText : lastValidTimeText;
                  const parsed = isValidTimeInput(candidate) ? parseTimeInput(candidate) : { hours: 0, minutes: 0 };
                  base.setHours(parsed.hours, parsed.minutes, 0, 0);
                  return base;
                })()}
                mode="time"
                display="default"
                is24Hour
                onChange={(_event: any, selectedDate?: Date) => {
                  setShowTimePicker(false);
                  if (!selectedDate) return;
                  const nextText = formatTimeForInput(selectedDate);
                  setDreamTimeText(nextText);
                  setLastValidTimeText(nextText);
                }}
              />
            )}
          </>
        )}
      </View>

      <Separator className="bg-[#eee]" />

      {/* Rêve lucide */}
      <View className="flex-row items-center justify-between">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Rêve lucide</Label>
        <Switch checked={isLucidDream} onCheckedChange={setIsLucidDream} />
      </View>

      <Separator className="bg-[#eee]" />

      {/* Type de rêve */}
      <View className="gap-2">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Type de rêve</Label>
        <Select
          value={selectedDreamType}
          onValueChange={(option: Option) => {
            if (option) setDreamType(option.value as DreamType);
          }}
        >
          <SelectTrigger className="bg-white border-[#ddd] w-full">
            <SelectValue placeholder="Sélectionnez un type" />
          </SelectTrigger>
          <SelectContent>
            {dreamTypes.map((dt) => (
              <SelectItem key={dt.value} value={dt.value} label={dt.label}>
                {dt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </View>

      <Separator className="bg-[#eee]" />

      {/* État émotionnel */}
      <View className="gap-2">
        <Label className="text-[#1a1a2e] text-sm font-semibold">État émotionnel</Label>
        <Select
          value={selectedEmotionalState}
          onValueChange={(option: Option) => {
            if (option) setEmotionalState(option.value as EmotionalState);
          }}
        >
          <SelectTrigger className="bg-white border-[#ddd] w-full">
            <SelectValue placeholder="Sélectionnez un état" />
          </SelectTrigger>
          <SelectContent>
            {emotionalStates.map((es) => (
              <SelectItem key={es.value} value={es.value} label={es.label}>
                {es.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </View>

      <Separator className="bg-[#eee]" />

      {/* Intensité émotionnelle */}
      <View className="gap-1">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Intensité émotionnelle : {emotionalIntensity}/10</Label>
        <Slider
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={emotionalIntensity}
          onValueChange={setEmotionalIntensity}
          minimumTrackTintColor="#7c73e6"
          maximumTrackTintColor="#e0dff5"
          thumbTintColor="#7c73e6"
        />
      </View>

      {/* Clarté */}
      <View className="gap-1">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Clarté du rêve : {clarity}/10</Label>
        <Slider
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={clarity}
          onValueChange={setClarity}
          minimumTrackTintColor="#7c73e6"
          maximumTrackTintColor="#e0dff5"
          thumbTintColor="#7c73e6"
        />
      </View>

      {/* Qualité du sommeil */}
      <View className="gap-1">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Qualité du sommeil : {sleepQuality}/10</Label>
        <Slider
          minimumValue={0}
          maximumValue={10}
          step={1}
          value={sleepQuality}
          onValueChange={setSleepQuality}
          minimumTrackTintColor="#7c73e6"
          maximumTrackTintColor="#e0dff5"
          thumbTintColor="#7c73e6"
        />
      </View>

      <Separator className="bg-[#eee]" />

      {/* Lieu */}
      <View className="gap-2">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Lieu du rêve</Label>
        <Input placeholder="Où se déroulait le rêve ?" value={place} onChangeText={setPlace} className="bg-white border-[#ddd]" />
      </View>

      <Separator className="bg-[#eee]" />

      {/* Personnages */}
      <View className="gap-2">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Personnages</Label>
        <View className="flex-row flex-wrap gap-2">
          {characters.length <= 0 ? (
            <Text className="text-sm text-[#999] italic">Aucun personnage</Text>
          ) : (
            characters.map((character) => (
              <View key={character.id} className="bg-[#f0eef9] px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                <Text className="text-sm text-[#1a1a2e]">{character.name}</Text>
                <Pressable onPress={() => setCharacters((prev) => prev.filter((c) => c.id !== character.id))}>
                  <XIcon size={14} color="#7c73e6" />
                </Pressable>
              </View>
            ))
          )}
        </View>
        <Input
          placeholder="Ajouter (séparés par une virgule)"
          value={addingCharacterValue}
          onChangeText={(text: string) => {
            setAddingCharacterValue(text);
            if (text.endsWith(",")) {
              const name = text.slice(0, -1).trim();
              if (name) {
                setCharacters((prev) => [...prev, { id: uuid.v4() as string, name }]);
              }
              setAddingCharacterValue("");
            }
          }}
          className="bg-white border-[#ddd]"
        />
      </View>

      <Separator className="bg-[#eee]" />

      {/* Mots-clés */}
      <View className="gap-2">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Mots-clés</Label>
        <View className="flex-row flex-wrap gap-2">
          {keywords.length <= 0 ? (
            <Text className="text-sm text-[#999] italic">Aucun mot-clé</Text>
          ) : (
            keywords.map((keyword) => (
              <View key={keyword.id} className="bg-[#f0eef9] px-3 py-1.5 rounded-full flex-row items-center gap-1.5">
                <Text className="text-sm text-[#1a1a2e]">{keyword.label}</Text>
                <Pressable onPress={() => setKeywords((prev) => prev.filter((k) => k.id !== keyword.id))}>
                  <XIcon size={14} color="#7c73e6" />
                </Pressable>
              </View>
            ))
          )}
        </View>
        <Input
          placeholder="Ajouter (séparés par une virgule)"
          value={addingKeywordValue}
          onChangeText={(text: string) => {
            setAddingKeywordValue(text);
            if (text.endsWith(",")) {
              const label = text.slice(0, -1).trim();
              if (label) {
                setKeywords((prev) => [...prev, { id: uuid.v4() as string, label }]);
              }
              setAddingKeywordValue("");
            }
          }}
          className="bg-white border-[#ddd]"
        />
      </View>

      <Separator className="bg-[#eee]" />

      {/* Signification personnelle */}
      <View className="gap-2">
        <Label className="text-[#1a1a2e] text-sm font-semibold">Signification personnelle</Label>
        <Textarea
          placeholder="Quelle signification ce rêve a-t-il pour vous ?"
          value={personnalSignificance}
          onChangeText={setPersonnalSignificance}
          numberOfLines={3}
          className="bg-white border-[#ddd] min-h-[80px]"
        />
      </View>

      {/* Bouton de soumission */}
      <Button onPress={handleDreamSubmission} className="mt-2 bg-[#7c73e6] active:bg-[#6a61d4] rounded-xl h-12">
        <Text className="text-white font-semibold text-base">Enregistrer le rêve</Text>
      </Button>
    </View>
  );
}
