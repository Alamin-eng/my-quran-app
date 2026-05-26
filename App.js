import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Amiri_400Regular } from '@expo-google-fonts/amiri';

// Import our local list of all 114 Surahs
import { SURAH_LIST } from './surahs';

export default function App() {
  const [currentSurahId, setCurrentSurahId] = useState(1);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);

  let [fontsLoaded] = useFonts({
    'QuranFont': Amiri_400Regular,
  });

  const activeSurah = SURAH_LIST.find(s => s.id === currentSurahId);

  useEffect(() => {
    async function loadSurahData() {
      setLoading(true);
      const cacheKey = `@surah_data_${currentSurahId}`;

      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        
        if (cachedData !== null) {
          setVerses(JSON.parse(cachedData));
          setLoading(false);
        } else {
          const url = `https://api.quran.com/api/v4/verses/by_chapter/${currentSurahId}?fields=text_qpc_hafs,page_number&per_page=300`;
          const response = await fetch(url);
          const data = await response.json();
          
          await AsyncStorage.setItem(cacheKey, JSON.stringify(data.verses));
          setVerses(data.verses);
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

  if (loading || !fontsLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Structuring Pages...</Text>
      </View>
    );
  }

  return (
    // 💡 FIX: SafeAreaView protects the entire app window layout from spilling under hardware notches
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Dropdown Selector Bar Container */}
      <View style={styles.pickerContainer}>
        <Text style={styles.pickerLabel}>Choose Surah:</Text>
        <Picker
          selectedValue={currentSurahId}
          onValueChange={(itemValue) => setCurrentSurahId(itemValue)}
          style={styles.dropdown}
          dropdownIconColor="#2e7d32"
        >
          {SURAH_LIST.map((surah) => (
            <Picker.Item 
              key={surah.id} 
              label={`${surah.id}. ${surah.name}`} 
              value={surah.id} 
              style={styles.pickerItemStyle}
            />
          ))}
        </Picker>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Nice Header View */}
        <View style={styles.headerBadge}>
          <Text style={styles.headerSubtitle}>SURAH</Text>
          <Text style={styles.headerTitle}>{activeSurah ? activeSurah.name : ''}</Text>
          <Text style={styles.headerNumber}>Chapter {activeSurah ? activeSurah.id : ''} • {activeSurah ? activeSurah.total_verses : ''} Verses</Text>
        </View>
        
        {/* Output Bismillah Header if applicable */}
        {currentSurahId !== 1 && currentSurahId !== 9 ? (
          <Text style={styles.bismillahText}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        ) : null}
        
        {/* Map out individual Page Blocks */}
        {Object.keys(pagesGroup).map((pageNumber) => (
          <View key={pageNumber} style={styles.pageBlock}>
            
            <View style={styles.versesTextWall}>
              {pagesGroup[pageNumber].map((ayah) => (
                <Text key={ayah.id} style={styles.arabicText}>
                  {ayah.text_qpc_hafs} 
                  <Text style={styles.verseNumberBadge}> ﴿{ayah.verse_number}﴾ </Text>
                </Text>
              ))}
            </View>

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
    backgroundColor: '#bafaf5' 
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9', // Added a subtle background color shift to make the bar distinct
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    
    // 💡 FIX: Adjusted dimension controls to give the touch targets maximum finger comfort
    height: 65, 
    marginTop: 10,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  pickerLabel: { fontSize: 15, fontWeight: '700', color: '#333', marginRight: 5 },
  dropdown: { 
    flex: 1, 
    color: '#000',
    backgroundColor: 'transparent',
  },
  pickerItemStyle: {
    fontSize: 16,
  },
  container: { flex: 1, paddingHorizontal: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
  
  headerBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#c8e6c9'
  },
  headerSubtitle: { fontSize: 11, fontWeight: '800', color: '#2e7d32', letterSpacing: 2 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#111', marginVertical: 4 },
  headerNumber: { fontSize: 13, color: '#666', fontWeight: '500' },

  bismillahText: { 
    fontFamily: 'QuranFont', 
    fontSize: 34, 
    textAlign: 'center', 
    color: '#2e7d32', 
    marginVertical: 25, 
    lineHeight: 50 
  },

  pageBlock: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 1, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  versesTextWall: {
    flexDirection: 'row-reverse', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-start',
    paddingBottom: 20,
  },
  arabicText: { 
    fontFamily: 'QuranFont', 
    fontSize: 30, 
    textAlign: 'right', 
    lineHeight: 64, 
    color: '#222',
  },
  verseNumberBadge: {
    fontSize: 18,
    color: '#2e7d32',
    fontWeight: 'normal',
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
});