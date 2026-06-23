import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
// Import our local list of all 114 Surahs
import { SURAH_LIST } from "./surahs";
const ENGLISH_CACHE_KEY = "@english_translation";

export default function App() {
  const [currentSurahId, setCurrentSurahId] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  // Settings Modal State
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedFont, setSelectedFont] = useState("hafs");

 // AsyncStorage.removeItem("@english_translation"); // RUN ONCE TO FLUSH THE BAD CACHE DATA

  let [fontsLoaded] = useFonts({
    hafs: require("./assets/Hafs.ttf"),
    ScheherazadeReg: require("./assets/ScheherazadeReg.ttf"),
    PFNuyorkArabicRegular: require("./assets/PFNuyorkArabicRegular.ttf"),
    IndopakNastaleeq: require("./assets/IndopakNastaleeq.ttf"),
    MuhammadiQuranicFont: require("./assets/MuhammadiQuranic.ttf"),
    "Tajawal-Regular": require("./assets/Tajawal-Regular.ttf"),
    AmiriQuranColored: require("./assets/AmiriQuranColored.ttf"),
    ArabQuranIslamic2: require("./assets/ArabQuranIslamic2.ttf"),
    "al-qalam-quran-majeed-2": require("./assets/al-qalam-quran-majeed-2.ttf"),
  });

  const activeSurah = SURAH_LIST.find((s) => s.id === currentSurahId);

  // Fetch English translation and cache it
  async function getEnglishTranslation() {
    try {
      const cachedTranslation = await AsyncStorage.getItem(ENGLISH_CACHE_KEY);

      // Clear out corrupt or broken cache references
      if (
        cachedTranslation &&
        cachedTranslation !== "undefined" &&
        cachedTranslation !== "null" &&
        cachedTranslation.trim() !== ""
      ) {
        return JSON.parse(cachedTranslation);
      }

      console.log("Downloading fresh English translation dataset...");
      const response = await fetch(
        "https://api.islamic.app/v1/quran/translations/en-sahih-international",
      );

      const result = await response.json();

      // Islamic.app returns { data: { verses: [...] } } or { data: [...] }
      const rawVerses = result?.data?.verses || result?.data || result || [];

      if (Array.isArray(rawVerses) && rawVerses.length > 0) {
        await AsyncStorage.setItem(
          ENGLISH_CACHE_KEY,
          JSON.stringify(rawVerses),
        );
        return rawVerses;
      }

      return [];
    } catch (error) {
      console.error("Error fetching translation database:", error);
      return [];
    }
  }

  useEffect(() => {
    async function loadSurahData() {
      setLoading(true);

      // Distinct key to completely ignore old, malformed caches
      const cacheKey = `@surah_cloud_final_v4_${currentSurahId}`; // Changed v3 to v4

      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);

        if (cachedData !== null) {
          console.log("Loading directly from stable cloud cache...");
          setVerses(JSON.parse(cachedData));
          setLoading(false);
        } else {
          // Multi-edition URL: requests both the beautiful text and Sahih International translation together
          const unifiedUrl = `https://api.alquran.cloud/v1/surah/${currentSurahId}/editions/quran-uthmani,en.sahih`;

          console.log(
            "Cache missed! Fetching clean payload from AlQuran Cloud...",
          );
          const response = await fetch(unifiedUrl);
          const result = await response.json();

          // AlQuran Cloud returns data as an array under result.data
          if (result && result.data && result.data.length === 2) {
            const arabicSourceArr =
              result.data[0].ayhas || result.data[0].ayahs || [];
            const englishSourceArr =
              result.data[1].ayhas || result.data[1].ayahs || [];

            const processedVerses = arabicSourceArr.map((ayah, index) => {
              const translationMatch = englishSourceArr[index];
              let cleanArabicText = ayah.text;

              // If it's the first verse of any Surah EXCEPT Fatihah (1) or Tawbah (9)
              if (
                ayah.numberInSurah === 1 &&
                currentSurahId !== 1 &&
                currentSurahId !== 9
              ) {
                // The Bismillah phrase from this API is exactly 39 characters long including its custom spaces.
                // We safely chop off the first 39 characters to reveal ONLY the actual verse content.
                if (cleanArabicText.length > 39) {
                  cleanArabicText = cleanArabicText.substring(39);
                }
              }

              return {
                id: ayah.number,
                verse_number: ayah.numberInSurah,
                verse_key: `${currentSurahId}:${ayah.numberInSurah}`,
                page_number: ayah.page,
                text_qpc_hafs: cleanArabicText.trim(), // Cleans up any remaining spaces
                translation_text: translationMatch ? translationMatch.text : "",
              };
            });

            await AsyncStorage.setItem(
              cacheKey,
              JSON.stringify(processedVerses),
            );
            setVerses(processedVerses);
          } else {
            setVerses([]);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Unified Cloud API Fetch Error: ", err);
        setLoading(false);
      }
    }

    loadSurahData();
  }, [currentSurahId]);

  // Group verses dynamically by their physical page numbers
  const pagesGroup = {};
  verses.forEach((ayah) => {
    const pNum = ayah.page_number;
    if (!pagesGroup[pNum]) {
      pagesGroup[pNum] = [];
    }
    pagesGroup[pNum].push(ayah);
  });

  // Font loading checker
  if (loading || !fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Structuring Pages...</Text>
      </View>
    );
  }

  // Helper helper array for mapping our font selections cleanly
  const fontOptionsList = [
    { id: "hafs", label: "Hafs Font" },
    { id: "ScheherazadeReg", label: "Scheherazade Font" },
    { id: "IndopakNastaleeq", label: "Indopak Nastaleeq" },
    { id: "PFNuyorkArabicRegular", label: "PF Nuyork Arabic" },
    { id: "MuhammadiQuranicFont", label: "Muhammadi Quranic" },
    { id: "Tajawal-Regular", label: "Tajawal Regular" },
    { id: "ArabQuranIslamic2", label: "Arab Quran Islamic 2" },
    { id: "AmiriQuranColored", label: "Amiri Quran Colored" },
    { id: "al-qalam-quran-majeed-2", label: "Al-Qalam Quran Majeed" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.pickerContainer}
          onPress={() => setDropdownVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.pickerLabel}>Choose Surah:</Text>
          <View style={styles.dropdownSelector}>
            <Text style={styles.selectedSurahText}>
              {activeSurah
                ? `${activeSurah.id}. ${activeSurah.name}`
                : "Select Surah"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setSettingsVisible(true)}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Surah Selection Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Surah</Text>
            <FlatList
              data={SURAH_LIST}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    item.id === currentSurahId && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setCurrentSurahId(item.id);
                    setDropdownVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      item.id === currentSurahId &&
                        styles.modalItemTextSelected,
                    ]}
                  >
                    {item.id}. {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Font Modal */}
      <Modal
        visible={settingsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSettingsVisible(false)}
        >
          <View style={styles.settingsModal}>
            <Text style={styles.modalTitle}>Choose Arabic Font</Text>
            <ScrollView showsVerticalScrollIndicator={true}>
              {fontOptionsList.map((font) => (
                <TouchableOpacity
                  key={font.id}
                  style={[
                    styles.fontOption,
                    selectedFont === font.id && styles.fontOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedFont(font.id);
                    setSettingsVisible(false);
                  }}
                >
                  <View style={styles.fontOptionRow}>
                    <Text style={styles.fontLabelText}>{font.label}</Text>
                    {/* Secure Preview: Only apply script family to actual Arabic characters */}
                    <Text
                      style={[
                        styles.fontPreviewArabic,
                        { fontFamily: font.id },
                      ]}
                    >
                      القرآن
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main Content View */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerSubtitle}>SURAH</Text>
          <Text style={styles.headerTitle}>
            {activeSurah ? activeSurah.name : ""}
          </Text>
          <Text style={styles.headerNumber}>
            Chapter {activeSurah ? activeSurah.id : ""} •{" "}
            {activeSurah ? activeSurah.total_verses : ""} Verses
          </Text>
        </View>

        {currentSurahId !== 1 && currentSurahId !== 9 ? (
          <Text style={[styles.bismillahText, { fontFamily: selectedFont }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        ) : null}

        {Object.keys(pagesGroup).map((pageNumber) => (
          <View key={pageNumber} style={styles.pageBlock}>
            {pagesGroup[pageNumber].map((ayah) => (
              <View key={ayah.verse_key} style={styles.ayahRowContainer}>
                {/* Arabic Text Block */}
                <Text style={[styles.arabicText, { fontFamily: selectedFont }]}>
                  {ayah.text_qpc_hafs}
                  <Text style={styles.verseNumberBadge}>
                    {" "}
                    ﴿{ayah.verse_number}﴾{" "}
                  </Text>
                </Text>

                {/* English Translation Block */}
                <Text style={styles.englishText}>
                  <Text style={styles.englishNumberPrefix}>
                    {ayah.verse_number}.{" "}
                  </Text>
                  {ayah.translation_text?.replace(/<[^>]*>/g, "")}
                </Text>
              </View>
            ))}

            {/* Bottom Book Pagination */}
            <View style={styles.pageFooterSeparator}>
              <View style={styles.lineDivider} />
              <Text style={styles.pageFooterText}>PAGE {pageNumber}</Text>
              <View style={styles.lineDivider} />
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    flex: 1,
    borderRadius: 10,
    marginTop: 2,
    height: 38,
    zIndex: 10,
    elevation: 3,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#333",
    marginRight: 8,
  },
  dropdownSelector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
  },
  selectedSurahText: {
    fontSize: 14,
    color: "#b90707",
    fontWeight: "600",
  },
  dropdownArrow: {
    fontSize: 10,
    color: "#2e7d32",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 12,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalItemSelected: {
    backgroundColor: "#e8f5e9",
  },
  modalItemText: {
    fontSize: 15,
    color: "#333",
  },
  modalItemTextSelected: {
    color: "#2e7d32",
    fontWeight: "bold",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    zIndex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 10, fontSize: 14, color: "#666" },

  headerBadge: {
    backgroundColor: "#e8f5e9",
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c8e6c9",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2e7d32",
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111",
    marginVertical: 4,
  },
  headerNumber: { fontSize: 13, color: "#666", fontWeight: "500" },

  bismillahText: {
    fontSize: 34,
    textAlign: "center",
    color: "#2e7d32",
    marginVertical: 25,
    lineHeight: 52,
  },

  pageBlock: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: "#f0f0f0",
    elevation: 1,
  },
  ayahRowContainer: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f7f7f7",
    paddingBottom: 16,
  },
  arabicText: {
    fontSize: 28,
    textAlign: "right",
    lineHeight: 60,
    color: "#222",
    marginBottom: 10,
  },
  verseNumberBadge: {
    fontSize: 18,
    color: "#2e7d32",
  },
  englishText: {
    fontSize: 15,
    color: "#000000",
    textAlign: "left",
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  englishNumberPrefix: {
    fontWeight: "bold",
    color: "#635968",
  },
  pageFooterSeparator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingTop: 10,
  },
  lineDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 10,
  },
  pageFooterText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 4,
  },
  settingsButton: {
    width: 42,
    height: 38,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7e7e7",
    justifyContent: "center",
    alignItems: "center",
  },
  settingsIcon: {
    fontSize: 18,
  },
  settingsModal: {
    width: "85%",
    maxHeight: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fontOption: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    marginTop: 10,
  },
  fontOptionSelected: {
    backgroundColor: "#e8f5e9",
    borderColor: "#2e7d32",
  },
  fontOptionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fontLabelText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  fontPreviewArabic: {
    fontSize: 20,
    color: "#2e7d32",
  },
});
