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
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
// Import your local list of all 114 Surahs
import { SURAH_LIST } from "./surahs";
// Import styles from file
import styles from "./styles";
// Import the SettingsModal component
import SettingsModal from "./SettingsModal";

const LANGUAGES = [
  { id: "en.sahih", label: "English (Sahih Intl)" },
  { id: "bn.bengali", label: "বাংলা (Muhiuddin Khan)" },
  { id: "zh.majian", label: "中文 (Ma Jian)" },
  { id: "ur.khan", label: "Urdu (Muhammad Khan)" },
  { id: "tr.ates", label: "Turkish (Suleyman Ates)" },
  { id: "fr.hamidullah", label: "French (Muhammad Hamidullah)" },
  { id: "es.cortes", label: "Spanish (Julio Cortes)" },
];

export default function App() {
  const [currentSurahId, setCurrentSurahId] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // --- Production State Engine for Settings & Personalization ---
  const [selectedFont, setSelectedFont] = useState("hafs");
  const [selectedLanguage, setSelectedLanguage] = useState("en.sahih");
  const [arabicFontSize, setArabicFontSize] = useState(28);
  const [translationFontSize, setTranslationFontSize] = useState(15);
  const [showTranslation, setShowTranslation] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  let [fontsLoaded] = useFonts({
    hafs: require("./assets/Hafs.ttf"),
    "NotoNaskhArabic-Reg": require("./assets/NotoNaskhArabic-Reg.ttf"),
    "ScheherazadeNew-Reg": require("./assets/ScheherazadeNew-Reg.ttf"),
    PFNuyorkArabicRegular: require("./assets/PFNuyorkArabicRegular.ttf"),
    IndopakNastaleeq: require("./assets/IndopakNastaleeq.ttf"),
    KfgqpcHafsUthmanic: require("./assets/KfgqpcHafsUthmanic.ttf"),
    "Al-Mushaf-Quran": require("./assets/Al Mushaf Quran.ttf"),
    nabi: require("./assets/Nabi.ttf"),
    PDMS_Saleem: require("./assets/PDMS_Saleem.ttf"),
    MuhammadiQuranicFont: require("./assets/MuhammadiQuranic.ttf"),
    "Tajawal-Regular": require("./assets/Tajawal-Regular.ttf"),
    AmiriQuranColored: require("./assets/AmiriQuranColored.ttf"),
    ArabQuranIslamic2: require("./assets/ArabQuranIslamic2.ttf"),
    "al-qalam-quran": require("./assets/Al Qalam Quran.ttf"),
    CairoPlayRegular: require("./assets/CairoPlay-Regular.ttf"),
    Mada: require("./assets/Mada-Regular.ttf"),
    me_quran: require("./assets/Me Quran.ttf"),
  });

  const activeSurah = SURAH_LIST.find((s) => s.id === currentSurahId);

  // Load Saved Preferences on Cold Boot
  useEffect(() => {
    async function loadPreferences() {
      try {
        const savedFont = await AsyncStorage.getItem("@pref_font");
        const savedLang = await AsyncStorage.getItem("@pref_lang");
        const savedMode = await AsyncStorage.getItem("@pref_darkmode");
        const savedShowTrans = await AsyncStorage.getItem("@pref_show_trans");

        if (savedFont) setSelectedFont(savedFont);
        if (savedLang) setSelectedLanguage(savedLang);
        if (savedMode) setIsDarkMode(savedMode === "true");
        if (savedShowTrans) setShowTranslation(savedShowTrans === "true");
      } catch (e) {
        console.error("Failed to load layout preferences", e);
      }
    }
    loadPreferences();
  }, []);

  // Main Dynamic Network Loop
  useEffect(() => {
    async function loadSurahData() {
      setLoading(true);
      const cacheKey = `@surah_v13_${selectedLanguage}_${currentSurahId}`;

      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);

        if (cachedData !== null) {
          setVerses(JSON.parse(cachedData));
          setLoading(false);
        } else {
          const unifiedUrl = `https://api.alquran.cloud/v1/surah/${currentSurahId}/editions/quran-uthmani,${selectedLanguage}`;
          const response = await fetch(unifiedUrl);
          const result = await response.json();

          if (result && result.data && result.data.length === 2) {
            const arabicSourceArr = result.data[0].ayahs || [];
            const translationSourceArr = result.data[1].ayahs || [];
            const processedVerses = [];

            arabicSourceArr.forEach((ayah, index) => {
              const translationMatch = translationSourceArr[index];
              let cleanArabicText = ayah.text;

              if (currentSurahId !== 1 && ayah.numberInSurah === 1) {
                const cleanComparison = cleanArabicText
                  .replace(/\uFEFF/g, "")
                  .trim();
                const standardBismillah =
                  "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

                // If the entire first ayah is just the Bismillah prefix, skip it (for non-Fatiha surahs)
                if (cleanComparison === standardBismillah) {
                  return;
                }

                // If Bismillah is prepended to the first verse (Surahs 2-114 except 9)
                if (
                  currentSurahId !== 9 &&
                  cleanArabicText.includes("بِسْمِ")
                ) {
                  cleanArabicText = cleanArabicText.replace(/\uFEFF/g, "");
                  // Trim standard 38-character Bismillah prefix from Ayah 1 of other Surahs
                  if (cleanArabicText.length > 38) {
                    cleanArabicText = cleanArabicText.substring(38);
                  }
                }
              }

              processedVerses.push({
                id: ayah.number,
                verse_number: ayah.numberInSurah,
                verse_key: `${currentSurahId}:${ayah.numberInSurah}`,
                page_number: ayah.page,
                text_qpc_hafs: cleanArabicText.trim(),
                translation_text: translationMatch ? translationMatch.text : "",
              });
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
  }, [currentSurahId, selectedLanguage]);

  const savePreference = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value.toString());
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Donation Button Click
  const handleDonation = () => {
    const donationUrl = "https://www.buymeacoffee.com/mohammedalaminruben";

    Linking.canOpenURL(donationUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(donationUrl);
        } else {
          Alert.alert("Error", "Unable to open donation link.");
        }
      })
      .catch((err) => console.error("An error occurred", err));
  };

  const pagesGroup = {};
  verses.forEach((ayah) => {
    const pNum = ayah.page_number;
    if (!pagesGroup[pNum]) pagesGroup[pNum] = [];
    pagesGroup[pNum].push(ayah);
  });

  if (loading || !fontsLoaded) {
    return (
      <View style={[styles.center, isDarkMode && styles.darkBg]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text
          style={[styles.loadingText, isDarkMode && styles.darkTextContent]}
        >
          Structuring Pages...
        </Text>
      </View>
    );
  }

  // Complete List of All Loaded Fonts
  const fontOptionsList = [
    { id: "hafs", label: "Hafs Font" },
    { id: "NotoNaskhArabic-Reg", label: "Noto Naskh Arabic" },
    { id: "ScheherazadeNew-Reg", label: "Scheherazade New" },
    { id: "PFNuyorkArabicRegular", label: "PF Nuyork Arabic" },
    { id: "IndopakNastaleeq", label: "Indopak Nastaleeq" },
    { id: "KfgqpcHafsUthmanic", label: "KFGQPC Hafs Uthmanic" },
    { id: "Al-Mushaf-Quran", label: "Al Mushaf Quran" },
    { id: "nabi", label: "Nabi Font" },
    { id: "PDMS_Saleem", label: "PDMS Saleem" },
    { id: "MuhammadiQuranicFont", label: "Muhammadi Quranic" },
    { id: "Tajawal-Regular", label: "Tajawal Regular" },
    { id: "AmiriQuranColored", label: "Amiri Quran Colored" },
    { id: "ArabQuranIslamic2", label: "Arab Quran Islamic 2" },
    { id: "al-qalam-quran", label: "Al Qalam Quran" },
    { id: "CairoPlayRegular", label: "Cairo Play Regular" },
    { id: "Mada", label: "Mada" },
    { id: "me_quran", label: "Me Quran" },
  ];

  const activeThemeContainer = isDarkMode
    ? styles.darkContainer
    : styles.lightContainer;
  const activeThemeBlock = isDarkMode ? styles.darkPageBlock : styles.pageBlock;
  const activeArabicText = isDarkMode
    ? styles.darkArabicText
    : styles.arabicText;
  const activeTranslationText = isDarkMode
    ? styles.darkEnglishText
    : styles.englishText;

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkBg]}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={isDarkMode ? "#121212" : "#f9f9f9"}
      />

      {/* Top Bar Navigation */}
      <View style={[styles.topBar, isDarkMode && styles.darkBg]}>
        <TouchableOpacity
          style={[styles.pickerContainer, isDarkMode && styles.darkBorderBg]}
          onPress={() => setDropdownVisible(true)}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.pickerLabel, isDarkMode && styles.darkTextContent]}
          >
            Select Surah:
          </Text>
          <View style={styles.dropdownSelector}>
            <Text
              style={[
                styles.selectedSurahText,
                isDarkMode && styles.selectSurahDarkText,
              ]}
            >
              {activeSurah
                ? `${activeSurah.id}. ${activeSurah.name}`
                : "Select Surah"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.settingsButton,
            isDarkMode && styles.darkBorderBg,
            { borderColor: isDarkMode ? "#c95c1c" : "#00a066" },
          ]}
          onPress={() => setSettingsVisible(true)}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={isDarkMode ? "#c95c1c" : "#00a066"}
          />
        </TouchableOpacity>
      </View>

      {/* Surah List Modal */}
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
          <View
            style={[styles.modalContent, isDarkMode && styles.darkModalContent]}
          >
            <Text style={styles.modalTitle}>Select a Surah</Text>
            <FlatList
              data={SURAH_LIST}
              keyExtractor={(item) => item.id.toString()}
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
                      isDarkMode && styles.darkTextContent,
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

      {/* Settings Modal Layout */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        showTranslation={showTranslation}
        setShowTranslation={setShowTranslation}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        languages={LANGUAGES}
        arabicFontSize={arabicFontSize}
        setArabicFontSize={setArabicFontSize}
        selectedFont={selectedFont}
        setSelectedFont={setSelectedFont}
        fontOptionsList={fontOptionsList}
        savePreference={savePreference}
        handleDonation={handleDonation}
      />

      {/* Main Chapter Content */}
      <ScrollView
        style={[styles.container, activeThemeContainer]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.headerBadge, isDarkMode && styles.darkHeaderBadge]}
        >
          <Text style={styles.headerSubtitle}>SURAH</Text>
          <Text
            style={[styles.headerTitle, isDarkMode && styles.darkTextHeader]}
          >
            {activeSurah ? activeSurah.name : ""}
          </Text>
          <Text
            style={[styles.headerNumber, isDarkMode && styles.darkTextContent]}
          >
            {activeSurah ? activeSurah.englishNameTranslation : ""} •{" "}
            {activeSurah ? activeSurah.revelationType : ""}
          </Text>
          <Text
            style={[styles.headerNumber, isDarkMode && styles.darkTextContent]}
          >
            Chapter {activeSurah ? activeSurah.id : ""} •{" "}
            {activeSurah ? activeSurah.total_verses : ""} Verses
          </Text>
        </View>

        {/* Display Header Bismillah for Surahs 2 through 114 (except Surah 9) */}
        {currentSurahId !== 1 && currentSurahId !== 9 ? (
          <Text style={[styles.bismillahText, { fontFamily: selectedFont }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        ) : null}

        {Object.keys(pagesGroup).map((pageNumber) => (
          <View key={pageNumber} style={activeThemeBlock}>
            {pagesGroup[pageNumber].map((ayah) => (
              <View key={ayah.verse_key} style={styles.ayahRowContainer}>
                <Text
                  style={[
                    activeArabicText,
                    { fontFamily: selectedFont, fontSize: arabicFontSize },
                  ]}
                >
                  {ayah.text_qpc_hafs}
                  <Text style={styles.verseNumberBadge}>
                    {" "}
                    ﴿{ayah.verse_number}﴾{" "}
                  </Text>
                </Text>

                {showTranslation && (
                  <Text
                    style={[
                      activeTranslationText,
                      { fontSize: translationFontSize },
                    ]}
                  >
                    <Text style={styles.englishNumberPrefix}>
                      {ayah.verse_number}.{" "}
                    </Text>
                    {ayah.translation_text}
                  </Text>
                )}
              </View>
            ))}

            <View style={styles.pageFooterSeparator}>
              <View style={styles.lineDivider} />
              <Text style={styles.pageFooterText}>PAGE {pageNumber}</Text>
              <View style={styles.lineDivider} />
            </View>
          </View>
        ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
