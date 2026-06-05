import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, StatusBar, SafeAreaView, TouchableOpacity, Modal, FlatList, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
// Import our local list of all 114 Surahs
import { SURAH_LIST } from './surahs';

export default function App() {
  const [currentSurahId, setCurrentSurahId] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  // Settings Modal State (for future font selection or other preferences)
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedFont, setSelectedFont] = useState('hafs');

  let [fontsLoaded] = useFonts({
    'hafs': require('./assets/Hafs.ttf'), // Hafs Arabic & Quran Font
    'ScheherazadeReg': require('./assets/ScheherazadeReg.ttf'), // ScheherazadeReg-Regular
  });

  const activeSurah = SURAH_LIST.find(s => s.id === currentSurahId);

  useEffect(() => {
    async function loadSurahData() {
      setLoading(true);
      const cacheKey = `@surah_data_v2_${currentSurahId}`; // Updated cache key to store translations safely

      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        
        if (cachedData !== null) {
          setVerses(JSON.parse(cachedData));
          setLoading(false);
        } else {
          // Added &translations=131 to fetch Dr. Mustafa Khattab's "The Clear Quran"
          const url = `https://api.quran.com/api/v4/verses/by_chapter/${currentSurahId}?fields=text_qpc_hafs,page_number&translations=131&per_page=300`;
          const response = await fetch(url);
          const data = await response.json();
          
          if (data && data.verses) {
            await AsyncStorage.setItem(cacheKey, JSON.stringify(data.verses));
            setVerses(data.verses);
          } else {
            setVerses([]);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Storage/API Fetch Error: ", err);
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

  // Web-safe font loading checker
  if (loading || !fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Structuring Pages...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />

      {/* Custom Sleek Dropdown Bar Selector */}
      
      {/* Top Bar */}
<View style={styles.topBar}>

  {/* Surah Selector */}
  <TouchableOpacity
    style={styles.pickerContainer}
    onPress={() => setDropdownVisible(true)}
    activeOpacity={0.8}
  >
    <Text style={styles.pickerLabel}>Choose Surah:</Text>

    <View style={styles.dropdownSelector}>
      <Text style={styles.selectedSurahText}>
        {activeSurah ? `${activeSurah.id}. ${activeSurah.name}` : 'Select Surah'}
      </Text>

      <Text style={styles.dropdownArrow}>▼</Text>
    </View>
  </TouchableOpacity>

  {/* Settings Button */}
  <TouchableOpacity
    style={styles.settingsButton}
    onPress={() => setSettingsVisible(true)}
  >
    <Text style={styles.settingsIcon}>⚙</Text>
  </TouchableOpacity>

</View>

      {/* Full Screen Safe Modal List Selection */}
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
                    item.id === currentSurahId && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setCurrentSurahId(item.id);
                    setDropdownVisible(false);
                  }}
                >
                  <Text style={[
                    styles.modalItemText,
                    item.id === currentSurahId && styles.modalItemTextSelected
                  ]}>
                    {item.id}. {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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

      <TouchableOpacity
        style={[
          styles.fontOption,
          selectedFont === 'hafs' && styles.fontOptionSelected
        ]}
        onPress={() => {
          setSelectedFont('hafs');
          setSettingsVisible(false);
        }}
      >
        <Text style={{ fontFamily: selectedFont, fontSize: 24 }}>
          Hafs Font
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.fontOption,
          selectedFont === 'ScheherazadeReg' && styles.fontOptionSelected
        ]}
        onPress={() => {
          setSelectedFont('ScheherazadeReg');
          setSettingsVisible(false);
        }}
      >
        <Text style={{ fontFamily: selectedFont, fontSize: 24 }}>
          Scheherazade Font
        </Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>
      {/* Main Content View */}
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header View */}
        <View style={styles.headerBadge}>
          <Text style={styles.headerSubtitle}>SURAH</Text>
          <Text style={styles.headerTitle}>{activeSurah ? activeSurah.name : ''}</Text>
          <Text style={styles.headerNumber}>Chapter {activeSurah ? activeSurah.id : ''} • {activeSurah ? activeSurah.total_verses : ''} Verses</Text>
        </View>
        
        {/* Output Bismillah Header if applicable */}
        {currentSurahId !== 1 && currentSurahId !== 9 ? (
          <Text style={[styles.bismillahText,{ fontFamily: selectedFont }]}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        ) : null}
        
        {/* Map out individual Page Blocks */}
        {Object.keys(pagesGroup).map((pageNumber) => (
          <View key={pageNumber} style={styles.pageBlock}>
            
            {/* For readable Translation layout, we loop stacked Ayah blocks */}
            {pagesGroup[pageNumber].map((ayah) => (
              <View key={ayah.id} style={styles.ayahRowContainer}>
                
                {/* Arabic Text Block */}
                <Text style={[styles.arabicText,{ fontFamily: selectedFont }]}>
                  {ayah.text_qpc_hafs} 
                  <Text style={styles.verseNumberBadge}> ﴿{ayah.verse_number}﴾ </Text>
                </Text>

                {/* English Translation Block */}
                {ayah.translations && ayah.translations[0] && (
                  <Text style={styles.englishText}>
                    <Text style={styles.englishNumberPrefix}>{ayah.verse_number}. </Text>
                    {/* Stripping out any accidental inline HTML tags from raw API text data */}
                    {ayah.translations[0].text.replace(/<[^>]*>/g, '')}
                  </Text>
                )}
                
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
    backgroundColor: '#f9f9f9' 
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e7e7e7',
    // marginHorizontal: 12,
    flex: 1,
    borderRadius: 10,
    marginTop: 2,         
    height: 38,           
    zIndex: 10,
    elevation: 3,
  },
  pickerLabel: { 
    fontSize: 12, 
    fontWeight: '700', 
    color: '#333', 
    marginRight: 8 
  },
  dropdownSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  selectedSurahText: {
    fontSize: 14,
    color: '#b90707',
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#2e7d32',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: {
    backgroundColor: '#e8f5e9',
  },
  modalItemText: {
    fontSize: 15,
    color: '#333',
  },
  modalItemTextSelected: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  container: { 
    flex: 1, 
    paddingHorizontal: 24,
    zIndex: 1,            
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
  
  headerBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,        
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9'
  },
  headerSubtitle: { fontSize: 11, fontWeight: '800', color: '#2e7d32', letterSpacing: 2 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111', marginVertical: 4 },
  headerNumber: { fontSize: 13, color: '#666', fontWeight: '500' },

  bismillahText: { 
    fontFamily: 'hafs',
    fontSize: 34, 
    textAlign: 'center', 
    color: '#2e7d32', 
    marginVertical: 25, 
    lineHeight: 52
  },

  pageBlock: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 1, 
  },
  ayahRowContainer: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f7f7f7',
    paddingBottom: 16,
  },
  arabicText: { 
    fontFamily: 'hafs', 
    fontSize: 28, 
    textAlign: 'right', 
    lineHeight: 60, 
    color: '#222',
    marginBottom: 10,
  },
  verseNumberBadge: {
    fontSize: 18,
    color: '#2e7d32',
  },
  englishText: {
    fontSize: 15,
    color: '#000000',
    textAlign: 'left',
    lineHeight: 24,
    paddingHorizontal: 4,
  },
  englishNumberPrefix: {
    fontWeight: 'bold',
    color: '#635968',
  },
  pageFooterSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
  },
  lineDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  pageFooterText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  topBar: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 12,
  marginTop: 4,
},

settingsButton: {
  width: 42,
  height: 38,
  marginLeft: 8,
  borderRadius: 10,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#e7e7e7',
  justifyContent: 'center',
  alignItems: 'center',
},

settingsIcon: {
  fontSize: 18,
},

settingsModal: {
  width: '80%',
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 20,
},

fontOption: {
  padding: 16,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#e5e5e5',
  marginTop: 12,
},

fontOptionSelected: {
  backgroundColor: '#e8f5e9',
  borderColor: '#2e7d32',
},
});