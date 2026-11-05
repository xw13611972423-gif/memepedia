import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import memesData from './data/memes.json';

const FAV_KEY = '@memepedia/favorites';

const CATEGORIES = ['全部', '2025年度流行语', '2025月度热梗', '2024年度流行语', '常用热梗'];

function App() {
  const [tab, setTab] = useState('browse'); // browse | favorites
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('全部');
  const [selected, setSelected] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(FAV_KEY).then((v) => {
      if (v) {
        try {
          setFavorites(JSON.parse(v));
        } catch (e) {}
      }
    });
  }, []);

  const toggleFavorite = async (id) => {
    let next;
    if (favorites.includes(id)) {
      next = favorites.filter((x) => x !== id);
    } else {
      next = [...favorites, id];
    }
    setFavorites(next);
    try {
      await AsyncStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch (e) {}
  };

  const filtered = useMemo(() => {
    let list = memesData;
    if (category !== '全部') {
      list = list.filter((m) => m.category === category);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (m) =>
          m.term.toLowerCase().includes(q) ||
          m.meaning.toLowerCase().includes(q) ||
          m.origin.toLowerCase().includes(q) ||
          m.example.toLowerCase().includes(q)
      );
    }
    return list;
  }, [query, category]);

  const favList = useMemo(
    () => memesData.filter((m) => favorites.includes(m.id)),
    [favorites]
  );

  if (selected) {
    return (
      <DetailScreen
        meme={selected}
        isFav={favorites.includes(selected.id)}
        onToggle={() => toggleFavorite(selected.id)}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>热梗百科</Text>
        <Text style={styles.subtitle}>离线热梗词典 · {memesData.length} 条</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="搜索热梗、释义、出处…"
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <View style={styles.chipsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {tab === 'browse' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>没搜到相关热梗 🦞</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelected(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTerm}>{item.term}</Text>
                {favorites.includes(item.id) && <Text style={styles.star}>★</Text>}
              </View>
              <Text style={styles.cardMeaning} numberOfLines={2}>
                {item.meaning}
              </Text>
              <Text style={styles.cardCat}>{item.category}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={favList}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>还没有收藏，去浏览页点 ★ 收藏吧</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setSelected(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTerm}>{item.term}</Text>
                <Text style={styles.star}>★</Text>
              </View>
              <Text style={styles.cardMeaning} numberOfLines={2}>
                {item.meaning}
              </Text>
              <Text style={styles.cardCat}>{item.category}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={styles.tabbar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'browse' && styles.tabActive]}
          onPress={() => setTab('browse')}
        >
          <Text style={[styles.tabText, tab === 'browse' && styles.tabTextActive]}>浏览</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'favorites' && styles.tabActive]}
          onPress={() => setTab('favorites')}
        >
          <Text style={[styles.tabText, tab === 'favorites' && styles.tabTextActive]}>
            收藏（{favList.length}）
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function DetailScreen({ meme, isFav, onToggle, onBack }) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onToggle}
          style={[styles.favBtn, isFav && styles.favBtnActive]}
        >
          <Text style={[styles.favBtnText, isFav && styles.favBtnTextActive]}>
            {isFav ? '★ 已收藏' : '☆ 收藏'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.detailBody}>
        <Text style={styles.detailTerm}>{meme.term}</Text>
        <Text style={styles.detailCat}>{meme.category}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>释义</Text>
          <Text style={styles.sectionText}>{meme.meaning}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>出处</Text>
          <Text style={styles.sectionText}>{meme.origin}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>例句</Text>
          <Text style={styles.sectionText}>{meme.example}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8F0' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 28, fontWeight: '800', color: '#3A2A1A' },
  subtitle: { fontSize: 13, color: '#A08060', marginTop: 4 },
  searchWrap: { paddingHorizontal: 20, marginTop: 12 },
  search: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#EAD9C4',
    color: '#333',
  },
  chipsWrap: { marginTop: 12, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#F3E5D2',
    marginLeft: 12,
  },
  chipActive: { backgroundColor: '#E8622C' },
  chipText: { color: '#8A6A4A', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '700' },
  list: { padding: 16, paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0E2CE',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTerm: { fontSize: 18, fontWeight: '700', color: '#3A2A1A' },
  star: { fontSize: 18, color: '#E8622C' },
  cardMeaning: { fontSize: 14, color: '#6B5540', marginTop: 6, lineHeight: 20 },
  cardCat: { fontSize: 12, color: '#B89A78', marginTop: 8 },
  empty: { textAlign: 'center', color: '#A08060', marginTop: 40, fontSize: 15 },
  tabbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#EDDFCC',
    backgroundColor: '#FFFDF8',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderTopWidth: 3, borderTopColor: '#E8622C' },
  tabText: { fontSize: 15, color: '#A08060' },
  tabTextActive: { color: '#E8622C', fontWeight: '700' },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDDFCC',
  },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backText: { fontSize: 16, color: '#E8622C', fontWeight: '600' },
  favBtn: {
    borderWidth: 1,
    borderColor: '#E8622C',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  favBtnActive: { backgroundColor: '#E8622C' },
  favBtnText: { color: '#E8622C', fontSize: 14, fontWeight: '600' },
  favBtnTextActive: { color: '#fff' },
  detailBody: { padding: 20 },
  detailTerm: { fontSize: 30, fontWeight: '800', color: '#3A2A1A' },
  detailCat: { fontSize: 13, color: '#B89A78', marginTop: 6 },
  section: { marginTop: 22 },
  sectionTitle: { fontSize: 13, color: '#E8622C', fontWeight: '700', marginBottom: 6 },
  sectionText: { fontSize: 16, color: '#4A3828', lineHeight: 26 },
});

export default App;
