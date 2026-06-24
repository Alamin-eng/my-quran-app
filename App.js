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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFonts } from "expo-font";
// Import your local list of all 114 Surahs
import { SURAH_LIST } from "./surahs";

// Production Configuration Mapping for Languages (Added Bangla & Chinese)
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
      const cacheKey = `@surah_v12_${selectedLanguage}_${currentSurahId}`;

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

              if (currentSurahId === 1 && ayah.numberInSurah === 1) {
                const cleanComparison = cleanArabicText.replace(/\uFEFF/g, "").trim();
                const standardBismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
                if (cleanComparison === standardBismillah || cleanComparison.includes("بِسْمِ")) {
                  return; 
                }
              }

              if (ayah.numberInSurah === 1 && currentSurahId !== 1 && currentSurahId !== 9) {
                cleanArabicText = cleanArabicText.replace(/\uFEFF/g, "");
                if (cleanArabicText.length > 38) {
                  cleanArabicText = cleanArabicText.substring(38);
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

            await AsyncStorage.setItem(cacheKey, JSON.stringify(processedVerses));
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

  const handleDonation = () => {
    // 💡 Replace with your personal PayPal, Stripe, or BuyMeACoffee link
    const donationUrl = "https://www.buymeacoffee.com/";
    Linking.canOpenURL(donationUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(donationUrl);
        } else {
          Alert.alert("Error", "Unable to open your web browser device handler.");
        }
      })
      .catch((err) => console.error(err));
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
        <Text style={[styles.loadingText, isDarkMode && styles.darkTextContent]}>Structuring Pages...</Text>
      </View>
    );
  }

  // Complete List of All Loaded Fonts
  const fontOptionsList = [
    { id: "hafs", label: "Hafs Font" },
    { id: "ScheherazadeReg", label: "Scheherazade" },
    { id: "PFNuyorkArabicRegular", label: "PF Nuyork Arabic" },
    { id: "IndopakNastaleeq", label: "Indopak Nastaleeq" },
    { id: "MuhammadiQuranicFont", label: "Muhammadi Quranic" },
    { id: "Tajawal-Regular", label: "Tajawal Regular" },
    { id: "AmiriQuranColored", label: "Amiri Quran Colored" },
    { id: "ArabQuranIslamic2", label: "Arab Quran Islamic 2" },
    { id: "al-qalam-quran-majeed-2", label: "Al Qalam Quran Majeed" },
  ];

  const activeThemeContainer = isDarkMode ? styles.darkContainer : styles.lightContainer;
  const activeThemeBlock = isDarkMode ? styles.darkPageBlock : styles.pageBlock;
  const activeArabicText = isDarkMode ? styles.darkArabicText : styles.arabicText;
  const activeTranslationText = isDarkMode ? styles.darkEnglishText : styles.englishText;

  return (
    <SafeAreaView style={[styles.safeArea, isDarkMode && styles.darkBg]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#121212" : "#f9f9f9"} />

      {/* Top Bar Navigation */}
      <View style={[styles.topBar, isDarkMode && styles.darkBg]}>
        <TouchableOpacity
          style={[styles.pickerContainer, isDarkMode && styles.darkBorderBg]}
          onPress={() => setDropdownVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.pickerLabel, isDarkMode && styles.darkTextContent]}>Surah:</Text>
          <View style={styles.dropdownSelector}>
            <Text style={styles.selectedSurahText}>
              {activeSurah ? `${activeSurah.id}. ${activeSurah.name}` : "Select Surah"}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.settingsButton, isDarkMode && styles.darkBorderBg]}
          onPress={() => setSettingsVisible(true)}
        >
          <Text style={[styles.settingsIcon, isDarkMode && styles.darkTextContent]}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Surah List Modal */}
      <Modal visible={dropdownVisible} transparent={true} animationType="fade" onRequestClose={() => setDropdownVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
          <View style={[styles.modalContent, isDarkMode && styles.darkModalContent]}>
            <Text style={styles.modalTitle}>Select a Surah</Text>
            <FlatList
              data={SURAH_LIST}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, item.id === currentSurahId && styles.modalItemSelected]}
                  onPress={() => {
                    setCurrentSurahId(item.id);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, isDarkMode && styles.darkTextContent, item.id === currentSurahId && styles.modalItemTextSelected]}>
                    {item.id}. {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal Layout */}
      <Modal visible={settingsVisible} transparent={true} animationType="fade" onRequestClose={() => setSettingsVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSettingsVisible(false)}>
          <View style={[styles.settingsModal, isDarkMode && styles.darkModalContent]}>
            <Text style={styles.modalTitle}>Display Controls</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              
              {/* Appearance */}
              <Text style={[styles.sectionLabel, isDarkMode && styles.darkTextHeader]}>Appearance Mode</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleBtn, !isDarkMode && styles.toggleActive]} onPress={() => { setIsDarkMode(false); savePreference("@pref_darkmode", false); }}>
                  <Text style={[styles.toggleBtnText, !isDarkMode && styles.toggleActiveText]}>Light</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, isDarkMode && styles.toggleActive]} onPress={() => { setIsDarkMode(true); savePreference("@pref_darkmode", true); }}>
                  <Text style={[styles.toggleBtnText, isDarkMode && styles.toggleActiveText]}>Dark</Text>
                </TouchableOpacity>
              </View>

              {/* Translation Toggle */}
              <Text style={[styles.sectionLabel, isDarkMode && styles.darkTextHeader]}>Translations Layer</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleBtn, showTranslation && styles.toggleActive]} onPress={() => { setShowTranslation(true); savePreference("@pref_show_trans", true); }}>
                  <Text style={[styles.toggleBtnText, showTranslation && styles.toggleActiveText]}>On</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleBtn, !showTranslation && styles.toggleActive]} onPress={() => { setShowTranslation(false); savePreference("@pref_show_trans", false); }}>
                  <Text style={[styles.toggleBtnText, !showTranslation && styles.toggleActiveText]}>Off</Text>
                </TouchableOpacity>
              </View>

              {/* Language Selector */}
              <Text style={[styles.sectionLabel, isDarkMode && styles.darkTextHeader]}>Translation Language</Text>
              <View style={styles.selectionWrap}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.id}
                    style={[styles.pillOption, selectedLanguage === lang.id && styles.pillOptionSelected]}
                    onPress={() => { setSelectedLanguage(lang.id); savePreference("@pref_lang", lang.id); }}
                  >
                    <Text style={[styles.pillOptionText, selectedLanguage === lang.id && styles.pillOptionTextSelected]}>{lang.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Font Size */}
              <Text style={[styles.sectionLabel, isDarkMode && styles.darkTextHeader]}>Arabic Font Sizing</Text>
              <View style={styles.sizeControlRow}>
                <TouchableOpacity style={styles.sizeBtn} onPress={() => setArabicFontSize(Math.max(20, arabicFontSize - 2))}>
                  <Text style={styles.sizeBtnText}>A-</Text>
                </TouchableOpacity>
                <Text style={[styles.sizeValueDisplay, isDarkMode && styles.darkTextContent]}>{arabicFontSize}px</Text>
                <TouchableOpacity style={styles.sizeBtn} onPress={() => setArabicFontSize(Math.min(44, arabicFontSize + 2))}>
                  <Text style={styles.sizeBtnText}>A+</Text>
                </TouchableOpacity>
              </View>

              {/* Font Typeface */}
              <Text style={[styles.sectionLabel, isDarkMode && styles.darkTextHeader]}>Arabic Font Typeface</Text>
              {fontOptionsList.map((font) => (
                <TouchableOpacity
                  key={font.id}
                  style={[styles.fontOption, isDarkMode && styles.darkFontOption, selectedFont === font.id && styles.fontOptionSelected]}
                  onPress={() => { setSelectedFont(font.id); savePreference("@pref_font", font.id); }}
                >
                  <View style={styles.fontOptionRow}>
                    <Text style={[styles.fontLabelText, isDarkMode && styles.darkTextContent]}>{font.label}</Text>
                    <Text style={[styles.fontPreviewArabic, { fontFamily: font.id }]}>القرآن</Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Personalized Support Section */}
              <View style={styles.donationSectionBorder}>
                <Text style={styles.donationHeadline}>Support the Developer</Text>
                <Text style={styles.donationSubtitle}>
                  Assalamu Alaikum! This app is developed and maintained entirely by Mohammad Al-Amin. If it has assisted your Quranic studies, consider supporting future development.
                </Text>
                <TouchableOpacity style={styles.donationButtonSubmit} onPress={handleDonation}>
                  <Text style={styles.donationButtonText}>❤️ Support My Work</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Main Chapter Content */}
      <ScrollView style={[styles.container, activeThemeContainer]} showsVerticalScrollIndicator={false}>
        <View style={[styles.headerBadge, isDarkMode && styles.darkHeaderBadge]}>
          <Text style={styles.headerSubtitle}>SURAH</Text>
          <Text style={[styles.headerTitle, isDarkMode && styles.darkTextHeader]}>{activeSurah ? activeSurah.name : ""}</Text>
          <Text style={[styles.headerNumber, isDarkMode && styles.darkTextContent]}>
            {activeSurah ? activeSurah.englishNameTranslation : ""} • {activeSurah ? activeSurah.revelationType : ""}
          </Text>
          <Text style={[styles.headerNumber, isDarkMode && styles.darkTextContent]}>
            Chapter {activeSurah ? activeSurah.id : ""} • {activeSurah ? activeSurah.total_verses : ""} Verses
          </Text>
        </View>

        {currentSurahId !== 1 && currentSurahId !== 9 ? (
          <Text style={[styles.bismillahText, { fontFamily: selectedFont }]}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
        ) : null}

        {Object.keys(pagesGroup).map((pageNumber) => (
          <View key={pageNumber} style={activeThemeBlock}>
            {pagesGroup[pageNumber].map((ayah) => (
              <View key={ayah.verse_key} style={styles.ayahRowContainer}>
                <Text style={[activeArabicText, { fontFamily: selectedFont, fontSize: arabicFontSize }]}>
                  {ayah.text_qpc_hafs}
                  <Text style={styles.verseNumberBadge}> ﴿{ayah.verse_number}﴾ </Text>
                </Text>

                {showTranslation && (
                  <Text style={[activeTranslationText, { fontSize: translationFontSize }]}>
                    <Text style={styles.englishNumberPrefix}>{ayah.verse_number}. </Text>
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

        {/* Footer Credit Layer */}
        <View style={styles.footerDeveloperCredit}>
          <Text style={[styles.creditText, isDarkMode && styles.darkTextContent]}>Designed & Developed with ❤️ by Mohammad Al-Amin</Text>
          <Text style={styles.creditSubtext}>May Allah reward your efforts. Ameen.</Text>
        </View>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9f9f9" },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginTop: 4 },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e7e7e7",
    flex: 1,
    borderRadius: 10,
    height: 38,
  },
  pickerLabel: { fontSize: 12, fontWeight: "700", color: "#333", marginRight: 8 },
  dropdownSelector: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  selectedSurahText: { fontSize: 14, color: "#b90707", fontWeight: "600" },
  dropdownArrow: { fontSize: 10, color: "#2e7d32" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { width: "85%", maxHeight: "70%", backgroundColor: "#fff", borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#2e7d32", marginBottom: 16, textAlign: "center" },
  modalItem: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  modalItemSelected: { backgroundColor: "#e8f5e9" },
  modalItemText: { fontSize: 15, color: "#333" },
  modalItemTextSelected: { color: "#2e7d32", fontWeight: "bold" },
  container: { flex: 1, paddingHorizontal: 24 },
  lightContainer: { backgroundColor: "#f9f9f9" },
  darkContainer: { backgroundColor: "#121212" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loadingText: { marginTop: 10, fontSize: 14, color: "#666" },
  headerBadge: { backgroundColor: "#e8f5e9", borderRadius: 12, padding: 20, marginTop: 8, marginBottom: 10, alignItems: "center", borderWidth: 1, borderColor: "#c8e6c9" },
  headerSubtitle: { fontSize: 11, fontWeight: "800", color: "#2e7d32", letterSpacing: 2 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#111", marginVertical: 4 },
  headerNumber: { fontSize: 13, color: "#666", fontWeight: "500" },
  bismillahText: { fontSize: 34, textAlign: "center", color: "#2e7d32", marginVertical: 25, lineHeight: 52 },
  pageBlock: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginVertical: 15, borderWidth: 1, borderColor: "#f0f0f0" },
  darkPageBlock: { backgroundColor: "#1e1e1e", borderRadius: 16, padding: 16, marginVertical: 15, borderWidth: 1, borderColor: "#2d2d2d" },
  ayahRowContainer: { marginBottom: 24, borderBottomWidth: 1, borderBottomColor: "#f7f7f7", paddingBottom: 16 },
  arabicText: { fontSize: 28, textAlign: "right", lineHeight: 60, color: "#222", marginBottom: 10 },
  darkArabicText: { fontSize: 28, textAlign: "right", lineHeight: 60, color: "#e0e0e0", marginBottom: 10 },
  verseNumberBadge: { fontSize: 18, color: "#2e7d32" },
  englishText: { fontSize: 15, color: "#000", textAlign: "left", lineHeight: 24 },
  darkEnglishText: { fontSize: 15, color: "#b0b0b0", textAlign: "left", lineHeight: 24 },
  englishNumberPrefix: { fontWeight: "bold", color: "#635968" },
  pageFooterSeparator: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 10 },
  lineDivider: { flex: 1, height: 1, backgroundColor: "#e0e0e0", marginHorizontal: 10 },
  pageFooterText: { fontSize: 11, color: "#999", fontWeight: "700", letterSpacing: 1.5 },
  settingsButton: { width: 42, height: 38, marginLeft: 8, borderRadius: 10, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e7e7e7", justifyContent: "center", alignItems: "center" },
  settingsIcon: { fontSize: 18 },
  settingsModal: { width: "85%", maxHeight: "80%", backgroundColor: "#fff", borderRadius: 16, padding: 18 },
  sectionLabel: { fontSize: 13, fontWeight: "700", color: "#444", marginTop: 14, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 },
  toggleRow: { flexDirection: "row", backgroundColor: "#f0f0f0", borderRadius: 8, padding: 2, marginBottom: 10 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  toggleActive: { backgroundColor: "#2e7d32" },
  toggleBtnText: { fontSize: 13, fontWeight: "600", color: "#666" },
  toggleActiveText: { color: "#fff" },
  selectionWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  pillOption: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "#ddd", backgroundColor: "#fafafa" },
  pillOptionSelected: { backgroundColor: "#e8f5e9", borderColor: "#2e7d32" },
  pillOptionText: { fontSize: 12, color: "#555" },
  pillOptionTextSelected: { color: "#2e7d32", fontWeight: "700" },
  sizeControlRow: { flexDirection: "row", alignItems: "center", gap: 16, marginVertical: 6 },
  sizeBtn: { backgroundColor: "#e8f5e9", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  sizeBtnText: { color: "#2e7d32", fontWeight: "bold", fontSize: 14 },
  sizeValueDisplay: { fontSize: 14, fontWeight: "600", color: "#333" },
  fontOption: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#e5e5e5", marginTop: 6 },
  fontOptionSelected: { backgroundColor: "#e8f5e9", borderColor: "#2e7d32" },
  fontOptionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fontLabelText: { fontSize: 14, color: "#333" },
  fontPreviewArabic: { fontSize: 18, color: "#2e7d32" },
  donationSectionBorder: { marginTop: 20, padding: 14, borderRadius: 12, backgroundColor: "#fffde7", borderWidth: 1, borderColor: "#fff59d", alignItems: "center" },
  donationHeadline: { fontSize: 14, fontWeight: "700", color: "#f57f17" },
  donationSubtitle: { fontSize: 11, color: "#5d4037", textAlign: "center", marginVertical: 6, lineHeight: 15 },
  donationButtonSubmit: { backgroundColor: "#f57f17", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 4, width: "100%", alignItems: "center" },
  donationButtonText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  footerDeveloperCredit: { marginTop: 30, alignItems: "center", paddingVertical: 10 },
  creditText: { fontSize: 13, fontWeight: "600", color: "#555" },
  creditSubtext: { fontSize: 11, color: "#999", fontStyle: "italic", marginTop: 2 },
  darkBg: { backgroundColor: "#121212" },
  darkBorderBg: { backgroundColor: "#1e1e1e", borderColor: "#2d2d2d" },
  darkTextContent: { color: "#b0b0b0" },
  darkTextHeader: { color: "#fff" },
  darkModalContent: { backgroundColor: "#1e1e1e" },
  darkFontOption: { borderColor: "#2d2d2d" },
  darkHeaderBadge: { backgroundColor: "#1b2e1c", borderColor: "#2e7d32" },
});