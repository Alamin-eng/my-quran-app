// SettingsModal.js
import React from "react";
import {
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Text,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import styles from "./styles"; // Adjust path as needed

export default function SettingsModal({
  visible,
  onClose,
  isDarkMode,
  setIsDarkMode,
  showTranslation,
  setShowTranslation,
  selectedLanguage,
  setSelectedLanguage,
  languages = [],
  arabicFontSize,
  setArabicFontSize,
  selectedFont,
  setSelectedFont,
  fontOptionsList = [],
  savePreference,
  handleDonation,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Background Overlay (tapping outside closes modal) */}
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Prevents taps inside the modal container from closing it */}
        <TouchableWithoutFeedback>
          <View
            style={[
              styles.settingsModal,
              isDarkMode && styles.darkModalContent,
            ]}
          >
            {/* Header Section with Title and X Button */}
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  isDarkMode && styles.darkTextHeader,
                ]}
              >
                Display Controls
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={isDarkMode ? "#ffffff" : "#333333"}
                />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Appearance */}
              <Text
                style={[
                  styles.sectionLabel,
                  isDarkMode && styles.darkTextHeader,
                ]}
              >
                Appearance Mode
              </Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    !isDarkMode && styles.toggleActive,
                  ]}
                  onPress={() => {
                    setIsDarkMode(false);
                    savePreference("@pref_darkmode", false);
                  }}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      !isDarkMode && styles.toggleActiveText,
                    ]}
                  >
                    Light
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, isDarkMode && styles.toggleActive]}
                  onPress={() => {
                    setIsDarkMode(true);
                    savePreference("@pref_darkmode", true);
                  }}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      isDarkMode && styles.toggleActiveText,
                    ]}
                  >
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Translation Toggle */}
              <Text
                style={[
                  styles.sectionLabel,
                  isDarkMode && styles.darkTextHeader,
                ]}
              >
                Translations Layer
              </Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    showTranslation && styles.toggleActive,
                  ]}
                  onPress={() => {
                    setShowTranslation(true);
                    savePreference("@pref_show_trans", true);
                  }}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      showTranslation && styles.toggleActiveText,
                    ]}
                  >
                    On
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    !showTranslation && styles.toggleActive,
                  ]}
                  onPress={() => {
                    setShowTranslation(false);
                    savePreference("@pref_show_trans", false);
                  }}
                >
                  <Text
                    style={[
                      styles.toggleBtnText,
                      !showTranslation && styles.toggleActiveText,
                    ]}
                  >
                    Off
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Language Selector */}
              <Text
                style={[
                  styles.sectionLabel,
                  isDarkMode && styles.darkTextHeader,
                ]}
              >
                Translation Language
              </Text>
              <View style={styles.selectionWrap}>
                {languages.map((lang) => (
                  <TouchableOpacity
                    key={lang.id}
                    style={[
                      styles.pillOption,
                      selectedLanguage === lang.id &&
                        styles.pillOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedLanguage(lang.id);
                      savePreference("@pref_lang", lang.id);
                    }}
                  >
                    <Text
                      style={[
                        styles.pillOptionText,
                        selectedLanguage === lang.id &&
                          styles.pillOptionTextSelected,
                      ]}
                    >
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Font Size */}
              <Text
                style={[
                  styles.sectionLabel,
                  isDarkMode && styles.darkTextHeader,
                ]}
              >
                Arabic Font Sizing
              </Text>
              <View style={styles.sizeControlRow}>
                <TouchableOpacity
                  style={styles.sizeBtn}
                  onPress={() =>
                    setArabicFontSize(Math.max(20, arabicFontSize - 2))
                  }
                >
                  <Text style={styles.sizeBtnText}>A-</Text>
                </TouchableOpacity>
                <Text
                  style={[
                    styles.sizeValueDisplay,
                    isDarkMode && styles.darkTextContent,
                  ]}
                >
                  {arabicFontSize}px
                </Text>
                <TouchableOpacity
                  style={styles.sizeBtn}
                  onPress={() =>
                    setArabicFontSize(Math.min(44, arabicFontSize + 2))
                  }
                >
                  <Text style={styles.sizeBtnText}>A+</Text>
                </TouchableOpacity>
              </View>

              {/* Font Typeface */}
              <Text
                style={[
                  styles.sectionLabel,
                  isDarkMode && styles.darkTextHeader,
                ]}
              >
                Arabic Font Typeface
              </Text>
              {fontOptionsList.map((font) => (
                <TouchableOpacity
                  key={font.id}
                  style={[
                    styles.fontOption,
                    isDarkMode && styles.darkFontOption,
                    selectedFont === font.id && styles.fontOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedFont(font.id);
                    savePreference("@pref_font", font.id);
                  }}
                >
                  <View style={styles.fontOptionRow}>
                    <Text
                      style={[
                        styles.fontLabelText,
                        isDarkMode && styles.darkTextContent,
                      ]}
                    >
                      {font.label}
                    </Text>
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

              {/* Support Section */}
              <View style={styles.donationSectionBorder}>
                <Text style={styles.donationHeadline}>
                  Support the Developer
                </Text>
                <Text style={styles.donationSubtitle}>
                  Assalamu Alaikum! If this app has assisted your Quranic
                  studies, consider supporting future development.
                </Text>
                <TouchableOpacity
                  style={styles.donationButtonSubmit}
                  onPress={handleDonation}
                >
                  <Text style={styles.donationButtonText}>
                    ❤️ Support My Work
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
}