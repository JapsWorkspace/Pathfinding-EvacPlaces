// screens/Guidelines.jsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Linking,
  TextInput,
} from "react-native";
import axios from "axios";

// ✅ import the separated design
import styles, { COLORS } from "../Designs/Guidelines";

export default function GuidelinesListScreen({ navigation }) {
  const [guidelines, setGuidelines] = useState([]);
  const [filteredGuidelines, setFilteredGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  const BASE_URL = "http://localhost:8000/api/guidelines/";
  const categories = ["all", "earthquake", "flood", "typhoon", "general"];

  useEffect(() => {
    fetchGuidelines();
  }, [selectedCategory]);

  useEffect(() => {
    handleSearch(searchText);
  }, [searchText, guidelines]);

  const fetchGuidelines = async () => {
    try {
      setLoading(true);
      let url = BASE_URL;
      if (selectedCategory !== "all") url = `${BASE_URL}?category=${selectedCategory}`;
      const response = await axios.get(url);
      setGuidelines(response.data);
      setFilteredGuidelines(response.data);
    } catch (error) {
      console.log("Error fetching guidelines:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === "") {
      setFilteredGuidelines(guidelines);
      setSuggestions([]);
      return;
    }
    const filtered = guidelines.filter((item) =>
      (item.title || "").toLowerCase().includes(text.toLowerCase())
    );
    setFilteredGuidelines(filtered);
    const autoSuggestions = filtered.map((item) => item.title).slice(0, 5);
    setSuggestions(autoSuggestions);
  };

  const selectSuggestion = (title) => {
    setSearchText(title);
    setSuggestions([]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>

      {/* meta */}
      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>Category: {item.category}</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>Status: {item.status}</Text>
        </View>
        <View style={styles.metaPill}>
          <Text style={styles.metaText}>Priority: {item.priorityLevel}</Text>
        </View>
      </View>

      {!!item.description && <Text style={styles.desc}>{item.description}</Text>}

      {item.attachments?.length > 0 && (
        <View style={{ marginTop: 10 }}>
          <Text style={styles.attachHeader}>Attachments:</Text>
          {item.attachments.map((file, index) =>
            /\.(jpg|jpeg|png|gif)$/i.test(file.fileUrl) ? (
              <Image
                key={index}
                source={{ uri: file.fileUrl }}
                style={{ width: 120, height: 120, marginTop: 6, borderRadius: 8 }}
              />
            ) : (
              <TouchableOpacity key={index} onPress={() => Linking.openURL(file.fileUrl)}>
                <Text style={styles.link}>{file.fileName}</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.phone}>
        {/* ---------- Header with Back ---------- */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <View style={styles.backGlyph} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Guidelines</Text>
        </View>

        {/* ---------- Search ---------- */}
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title..."
          value={searchText}
          onChangeText={handleSearch}
          placeholderTextColor={COLORS.placeholder}
        />

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((title, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => selectSuggestion(title)}
                style={styles.suggestionItem}
              >
                <Text>{title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ---------- Category chips ---------- */}
        <View style={styles.filterContainer}>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ---------- List ---------- */}
        <FlatList
          data={filteredGuidelines}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>
    </View>
  );
}
